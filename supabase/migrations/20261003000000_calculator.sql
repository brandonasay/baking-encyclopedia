-- Home Bakery Calculator — PRD dated 2026-10-03
-- Adds 13 calc_* tables (12 from the PRD + calc_events for analytics, a
-- resolved open question — see memory/project_baking_calculator.md) and two
-- density columns on `ingredients`. Run this in the Supabase SQL Editor.
--
-- Resolved decisions baked into this migration:
--   - No Homebaked fee preset row (CTA-only for v1).
--   - calc_settings/calc_products carry a count_labor_as_cost toggle (new
--     scope beyond the PRD — the hobby "don't count my time" switch).
--   - calc_events is a new internal table (no third-party analytics vendor).

-- ─── Idempotent updated_at trigger (reused from the existing setup) ─────────

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ─── Shared enums ────────────────────────────────────────────────────────

do $$ begin
  create type calc_unit_code as enum (
    'g', 'kg', 'oz', 'lb',
    'ml', 'l', 'tsp', 'tbsp', 'floz', 'cup', 'pint', 'quart', 'gallon',
    'each', 'dozen'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type calc_pantry_kind as enum ('ingredient', 'packaging', 'other');
exception when duplicate_object then null;
end $$;

-- ─── ingredients: density columns for cross-dimension conversion ──────────

alter table public.ingredients
  add column if not exists grams_per_cup numeric(12, 4),
  add column if not exists grams_per_each numeric(12, 4);

comment on column public.ingredients.grams_per_cup is
  'Grams per US cup, for the calculator''s volume<->mass conversion. Baker-entered pantry overrides take precedence over this.';
comment on column public.ingredients.grams_per_each is
  'Grams per single unit (e.g. one egg), for the calculator''s count<->mass conversion.';

-- ─── calc_fee_presets ──────────────────────────────────────────────────────

create table if not exists public.calc_fee_presets (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  fee_pct numeric(6, 5) not null check (fee_pct >= 0 and fee_pct <= 1),
  fee_fixed numeric(12, 4) not null default 0 check (fee_fixed >= 0),
  source_url text,
  verified_on date,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.calc_fee_presets
  for each row execute function public.set_updated_at();

alter table public.calc_fee_presets enable row level security;

create policy "fee presets are publicly readable when active"
  on public.calc_fee_presets for select
  using (active);
-- No insert/update/delete policy for authenticated/anon — writes only via
-- the service-role key in admin routes, matching existing admin content.

-- ─── calc_settings (one row per user) ──────────────────────────────────────

create table if not exists public.calc_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  hourly_rate numeric(12, 4) not null default 0 check (hourly_rate >= 0),
  monthly_overhead numeric(12, 4) not null default 0 check (monthly_overhead >= 0),
  expected_products_per_month numeric(12, 4) not null default 0 check (expected_products_per_month >= 0),
  default_margin_pct numeric(5, 4) not null default 0.30 check (default_margin_pct >= 0 and default_margin_pct <= 0.90),
  default_fee_preset_id uuid references public.calc_fee_presets(id),
  custom_fee_pct numeric(6, 5) check (custom_fee_pct is null or (custom_fee_pct >= 0 and custom_fee_pct <= 1)),
  custom_fee_fixed numeric(12, 4) check (custom_fee_fixed is null or custom_fee_fixed >= 0),
  price_step numeric(12, 4) not null default 0.50 check (price_step > 0),
  currency text not null default 'USD',
  count_labor_as_cost boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.calc_settings
  for each row execute function public.set_updated_at();

alter table public.calc_settings enable row level security;

create policy "users manage their own settings"
  on public.calc_settings for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── calc_pantry_items ──────────────────────────────────────────────────────

create table if not exists public.calc_pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ingredient_id uuid references public.ingredients(id) on delete set null,
  name text not null,
  kind calc_pantry_kind not null,
  package_qty numeric(14, 4) not null check (package_qty > 0),
  package_unit calc_unit_code not null,
  package_price numeric(12, 4) not null check (package_price >= 0),
  usable_yield_pct numeric(5, 2) not null default 100 check (usable_yield_pct > 0 and usable_yield_pct <= 100),
  grams_per_cup numeric(12, 4) check (grams_per_cup is null or grams_per_cup > 0),
  grams_per_each numeric(12, 4) check (grams_per_each is null or grams_per_each > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calc_pantry_items_user_id_idx on public.calc_pantry_items(user_id);
create index if not exists calc_pantry_items_ingredient_id_idx on public.calc_pantry_items(ingredient_id);

create trigger set_updated_at before update on public.calc_pantry_items
  for each row execute function public.set_updated_at();

alter table public.calc_pantry_items enable row level security;

create policy "users manage their own pantry items"
  on public.calc_pantry_items for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── calc_recipes ──────────────────────────────────────────────────────────

create table if not exists public.calc_recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  yield_qty numeric(14, 4) not null check (yield_qty > 0),
  yield_unit_label text not null,
  active_minutes numeric(10, 2) not null default 0 check (active_minutes >= 0),
  batch_increment numeric(6, 2) not null default 1 check (batch_increment > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calc_recipes_user_id_idx on public.calc_recipes(user_id);

create trigger set_updated_at before update on public.calc_recipes
  for each row execute function public.set_updated_at();

alter table public.calc_recipes enable row level security;

create policy "users manage their own recipes"
  on public.calc_recipes for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── calc_recipe_lines ──────────────────────────────────────────────────────

create table if not exists public.calc_recipe_lines (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.calc_recipes(id) on delete cascade,
  pantry_item_id uuid not null references public.calc_pantry_items(id) on delete restrict,
  qty numeric(14, 4) not null check (qty > 0),
  unit calc_unit_code not null,
  note text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calc_recipe_lines_recipe_id_idx on public.calc_recipe_lines(recipe_id);
create index if not exists calc_recipe_lines_pantry_item_id_idx on public.calc_recipe_lines(pantry_item_id);

create trigger set_updated_at before update on public.calc_recipe_lines
  for each row execute function public.set_updated_at();

alter table public.calc_recipe_lines enable row level security;

create policy "users manage lines on their own recipes"
  on public.calc_recipe_lines for all
  using (exists (
    select 1 from public.calc_recipes r
    where r.id = calc_recipe_lines.recipe_id and r.user_id = auth.uid()
  ))
  with check (
    exists (
      select 1 from public.calc_recipes r
      where r.id = calc_recipe_lines.recipe_id and r.user_id = auth.uid()
    )
    and exists (
      select 1 from public.calc_pantry_items p
      where p.id = calc_recipe_lines.pantry_item_id and p.user_id = auth.uid()
    )
  );

-- ─── calc_products ──────────────────────────────────────────────────────────

create table if not exists public.calc_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  extra_minutes numeric(10, 2) not null default 0 check (extra_minutes >= 0),
  target_margin_pct numeric(5, 4) check (target_margin_pct is null or (target_margin_pct >= 0 and target_margin_pct <= 0.90)),
  fee_preset_id uuid references public.calc_fee_presets(id),
  set_price numeric(12, 4) check (set_price is null or set_price >= 0),
  price_step numeric(12, 4) check (price_step is null or price_step > 0),
  -- null = inherit calc_settings.count_labor_as_cost
  count_labor_as_cost boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calc_products_user_id_idx on public.calc_products(user_id);

create trigger set_updated_at before update on public.calc_products
  for each row execute function public.set_updated_at();

alter table public.calc_products enable row level security;

create policy "users manage their own products"
  on public.calc_products for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── calc_product_components ────────────────────────────────────────────────

create table if not exists public.calc_product_components (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.calc_products(id) on delete cascade,
  recipe_id uuid not null references public.calc_recipes(id) on delete restrict,
  qty numeric(14, 4) not null check (qty > 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calc_product_components_product_id_idx on public.calc_product_components(product_id);
create index if not exists calc_product_components_recipe_id_idx on public.calc_product_components(recipe_id);

create trigger set_updated_at before update on public.calc_product_components
  for each row execute function public.set_updated_at();

alter table public.calc_product_components enable row level security;

create policy "users manage components on their own products"
  on public.calc_product_components for all
  using (exists (
    select 1 from public.calc_products pr
    where pr.id = calc_product_components.product_id and pr.user_id = auth.uid()
  ))
  with check (
    exists (
      select 1 from public.calc_products pr
      where pr.id = calc_product_components.product_id and pr.user_id = auth.uid()
    )
    and exists (
      select 1 from public.calc_recipes r
      where r.id = calc_product_components.recipe_id and r.user_id = auth.uid()
    )
  );

-- ─── calc_product_packaging ─────────────────────────────────────────────────
-- Note: adds a `unit` column beyond the PRD's listed columns, for parity with
-- calc_recipe_lines — the pricing engine costs packaging lines the same way
-- it costs recipe lines, so they need the same shape.

create table if not exists public.calc_product_packaging (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.calc_products(id) on delete cascade,
  pantry_item_id uuid not null references public.calc_pantry_items(id) on delete restrict,
  qty numeric(14, 4) not null check (qty > 0),
  unit calc_unit_code not null default 'each',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calc_product_packaging_product_id_idx on public.calc_product_packaging(product_id);
create index if not exists calc_product_packaging_pantry_item_id_idx on public.calc_product_packaging(pantry_item_id);

create trigger set_updated_at before update on public.calc_product_packaging
  for each row execute function public.set_updated_at();

alter table public.calc_product_packaging enable row level security;

create policy "users manage packaging on their own products"
  on public.calc_product_packaging for all
  using (exists (
    select 1 from public.calc_products pr
    where pr.id = calc_product_packaging.product_id and pr.user_id = auth.uid()
  ))
  with check (
    exists (
      select 1 from public.calc_products pr
      where pr.id = calc_product_packaging.product_id and pr.user_id = auth.uid()
    )
    and exists (
      select 1 from public.calc_pantry_items p
      where p.id = calc_product_packaging.pantry_item_id and p.user_id = auth.uid()
    )
  );

-- ─── calc_plans ──────────────────────────────────────────────────────────────

create table if not exists public.calc_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  sale_date date,
  fee_preset_id uuid references public.calc_fee_presets(id),
  frozen_at timestamptz,
  frozen_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calc_plans_user_id_idx on public.calc_plans(user_id);

create trigger set_updated_at before update on public.calc_plans
  for each row execute function public.set_updated_at();

alter table public.calc_plans enable row level security;

create policy "users manage their own plans"
  on public.calc_plans for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── calc_plan_orders ────────────────────────────────────────────────────────

create table if not exists public.calc_plan_orders (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.calc_plans(id) on delete cascade,
  customer_label text,
  note text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calc_plan_orders_plan_id_idx on public.calc_plan_orders(plan_id);

create trigger set_updated_at before update on public.calc_plan_orders
  for each row execute function public.set_updated_at();

alter table public.calc_plan_orders enable row level security;

create policy "users manage orders on their own plans"
  on public.calc_plan_orders for all
  using (exists (
    select 1 from public.calc_plans pl
    where pl.id = calc_plan_orders.plan_id and pl.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.calc_plans pl
    where pl.id = calc_plan_orders.plan_id and pl.user_id = auth.uid()
  ));

-- ─── calc_plan_order_lines ───────────────────────────────────────────────────

create table if not exists public.calc_plan_order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.calc_plan_orders(id) on delete cascade,
  product_id uuid not null references public.calc_products(id) on delete restrict,
  qty numeric(14, 4) not null check (qty > 0),
  unit_price_override numeric(12, 4) check (unit_price_override is null or unit_price_override >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calc_plan_order_lines_order_id_idx on public.calc_plan_order_lines(order_id);
create index if not exists calc_plan_order_lines_product_id_idx on public.calc_plan_order_lines(product_id);

create trigger set_updated_at before update on public.calc_plan_order_lines
  for each row execute function public.set_updated_at();

alter table public.calc_plan_order_lines enable row level security;

create policy "users manage lines on their own plan orders"
  on public.calc_plan_order_lines for all
  using (exists (
    select 1 from public.calc_plan_orders o
    join public.calc_plans pl on pl.id = o.plan_id
    where o.id = calc_plan_order_lines.order_id and pl.user_id = auth.uid()
  ))
  with check (
    exists (
      select 1 from public.calc_plan_orders o
      join public.calc_plans pl on pl.id = o.plan_id
      where o.id = calc_plan_order_lines.order_id and pl.user_id = auth.uid()
    )
    and exists (
      select 1 from public.calc_products pr
      where pr.id = calc_plan_order_lines.product_id and pr.user_id = auth.uid()
    )
  );

-- ─── calc_plan_on_hand ───────────────────────────────────────────────────────

create table if not exists public.calc_plan_on_hand (
  plan_id uuid not null references public.calc_plans(id) on delete cascade,
  pantry_item_id uuid not null references public.calc_pantry_items(id) on delete restrict,
  qty numeric(14, 4) not null default 0 check (qty >= 0),
  unit calc_unit_code not null,
  checked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (plan_id, pantry_item_id)
);

create index if not exists calc_plan_on_hand_pantry_item_id_idx on public.calc_plan_on_hand(pantry_item_id);

create trigger set_updated_at before update on public.calc_plan_on_hand
  for each row execute function public.set_updated_at();

alter table public.calc_plan_on_hand enable row level security;

create policy "users manage on-hand stock on their own plans"
  on public.calc_plan_on_hand for all
  using (exists (
    select 1 from public.calc_plans pl
    where pl.id = calc_plan_on_hand.plan_id and pl.user_id = auth.uid()
  ))
  with check (
    exists (
      select 1 from public.calc_plans pl
      where pl.id = calc_plan_on_hand.plan_id and pl.user_id = auth.uid()
    )
    and exists (
      select 1 from public.calc_pantry_items p
      where p.id = calc_plan_on_hand.pantry_item_id and p.user_id = auth.uid()
    )
  );

-- ─── calc_events (analytics — resolved open question, not in original PRD) ──
-- Insert-only, written server-side with the service-role key (same pattern
-- as the existing `page_views` / `/api/track` route) — no client RLS policy
-- needed since anon/authenticated clients never write directly.

create table if not exists public.calc_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  session_id text,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists calc_events_event_name_idx on public.calc_events(event_name);
create index if not exists calc_events_user_id_idx on public.calc_events(user_id);
create index if not exists calc_events_created_at_idx on public.calc_events(created_at);

alter table public.calc_events enable row level security;
-- No policies: service-role key (which bypasses RLS) is the only writer/reader.

-- ─── Seed fee presets ────────────────────────────────────────────────────────
-- Rates checked 2026-10-03 (see PRD "Sources"). "Custom" is a UI-only option
-- (baker enters calc_settings.custom_fee_pct/custom_fee_fixed) — not a row
-- here. Homebaked is intentionally excluded per the resolved open question
-- (CTA-only for v1, not a selectable payment method).

insert into public.calc_fee_presets (name, fee_pct, fee_fixed, source_url, verified_on, sort_order, active)
values
  ('Cash / Zelle', 0, 0, null, '2026-10-03', 0, true),
  ('Venmo business profile', 0.019, 0.10, 'https://venmo.com/resources/our-fees/', '2026-10-03', 1, true),
  ('Square, in person (Free plan)', 0.026, 0.15, 'https://squareup.com/help/us/en/article/5068-what-are-square-s-fees', '2026-10-03', 2, true),
  ('Stripe, online card', 0.029, 0.30, 'https://stripe.com/pricing', '2026-10-03', 3, true),
  ('Hotplate (default split; customer pays Hotplate''s own fee)', 0.029, 0.30, 'https://www.hotplate.com/pricing', '2026-10-03', 4, true),
  ('Square, online (Free plan)', 0.033, 0.30, 'https://squareup.com/help/us/en/article/5068-what-are-square-s-fees', '2026-10-03', 5, true)
on conflict (name) do nothing;

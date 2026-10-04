-- Draft ingredient density seeding for the Home Bakery Calculator's
-- volume<->mass unit conversion (grams_per_cup / grams_per_each on
-- `ingredients`, added in 20261003000000_calculator.sql).
--
-- IMPORTANT — this is a DRAFT, not verified data:
--   - Values are standard baking-reference weights (King Arthur Baking's
--     published ingredient weight chart and similar widely-used sources),
--     not measured against your specific ingredient entries.
--   - Matching is by ingredient NAME (case-insensitive, trimmed, with a
--     few common spelling variants per ingredient) against your EXISTING
--     `ingredients` rows — it does not create new ingredients.
--   - Only fills grams_per_cup/grams_per_each where BOTH are currently
--     null, so it can never silently overwrite a value you've already
--     entered through the admin form.
--   - A name with no match in your table is simply a no-op — safe to run
--     even though we don't know your exact ingredient list from here.
--
-- Spot-check what actually matched before trusting it for real costing:
--   select name, grams_per_cup, grams_per_each from public.ingredients
--   where grams_per_cup is not null or grams_per_each is not null
--   order by name;

with density_seed (names, cup_g, each_g) as (
  values
    -- Flours
    (array['all-purpose flour', 'all purpose flour', 'ap flour'], 120::numeric, null::numeric),
    (array['bread flour'], 127, null),
    (array['cake flour'], 114, null),
    (array['pastry flour'], 113, null),
    (array['whole wheat flour', 'whole-wheat flour'], 113, null),
    (array['self-rising flour', 'self rising flour'], 125, null),
    (array['almond flour', 'almond meal'], 96, null),
    (array['coconut flour'], 112, null),
    (array['rye flour'], 102, null),
    (array['00 flour', 'tipo 00 flour'], 130, null),

    -- Sugars
    (array['granulated sugar', 'white sugar', 'sugar'], 200, null),
    (array['brown sugar', 'light brown sugar', 'dark brown sugar', 'packed brown sugar'], 213, null),
    (array['powdered sugar', 'confectioners sugar', 'confectioner''s sugar', 'icing sugar'], 113, null),
    (array['superfine sugar', 'caster sugar'], 200, null),
    (array['turbinado sugar', 'raw sugar'], 200, null),

    -- Fats & dairy
    (array['butter', 'unsalted butter', 'salted butter'], 227, null),
    (array['vegetable oil', 'canola oil', 'oil'], 218, null),
    (array['olive oil'], 216, null),
    (array['coconut oil'], 218, null),
    (array['shortening', 'vegetable shortening', 'crisco'], 205, null),
    (array['lard'], 205, null),
    (array['milk', 'whole milk', '2% milk'], 240, null),
    (array['buttermilk'], 245, null),
    (array['heavy cream', 'heavy whipping cream', 'whipping cream'], 240, null),
    (array['half and half', 'half-and-half'], 242, null),
    (array['sour cream'], 240, null),
    (array['cream cheese'], 232, null),
    (array['yogurt', 'plain yogurt', 'greek yogurt'], 245, null),
    (array['evaporated milk'], 252, null),
    (array['sweetened condensed milk', 'condensed milk'], 306, null),

    -- Leaveners & salt
    (array['baking powder'], 220, null),
    (array['baking soda'], 220, null),
    (array['salt', 'table salt'], 292, null),
    (array['kosher salt'], 240, null),
    (array['yeast', 'active dry yeast', 'instant yeast'], 150, null),

    -- Chocolate & cocoa
    (array['cocoa powder', 'unsweetened cocoa powder', 'cocoa'], 84, null),
    (array['chocolate chips', 'semisweet chocolate chips', 'dark chocolate chips'], 170, null),
    (array['white chocolate chips'], 170, null),
    (array['chopped chocolate'], 170, null),

    -- Nuts, seeds, dried fruit, oats
    (array['almonds', 'whole almonds'], 143, null),
    (array['walnuts', 'chopped walnuts'], 120, null),
    (array['pecans', 'chopped pecans'], 109, null),
    (array['shredded coconut', 'sweetened shredded coconut'], 93, null),
    (array['raisins'], 165, null),
    (array['dried cranberries', 'craisins'], 120, null),
    (array['chia seeds'], 168, null),
    (array['flax seed', 'ground flaxseed', 'flaxseed'], 112, null),
    (array['rolled oats', 'old-fashioned oats', 'oats'], 90, null),
    (array['quick oats'], 90, null),

    -- Liquids & sweeteners
    (array['water'], 237, null),
    (array['honey'], 340, null),
    (array['maple syrup'], 322, null),
    (array['molasses'], 328, null),
    (array['corn syrup', 'light corn syrup'], 328, null),
    (array['vanilla extract', 'vanilla'], 208, null),
    (array['peanut butter'], 258, null),
    (array['lemon juice'], 245, null),
    (array['lime juice'], 245, null),

    -- Grains & starches
    (array['white rice', 'uncooked rice', 'rice'], 185, null),
    (array['brown rice'], 190, null),
    (array['cornstarch', 'corn starch'], 120, null),
    (array['breadcrumbs', 'bread crumbs'], 108, null),
    (array['panko', 'panko breadcrumbs'], 50, null),

    -- Spices
    (array['ground cinnamon', 'cinnamon'], 118, null),
    (array['ground nutmeg', 'nutmeg'], 113, null),

    -- Count-based (grams per each, not per cup)
    (array['egg', 'eggs', 'large egg', 'whole egg'], null, 50),
    (array['egg white', 'large egg white', 'egg whites'], null, 30),
    (array['egg yolk', 'large egg yolk', 'egg yolks'], null, 18)
)
update public.ingredients i
set
  grams_per_cup = coalesce(i.grams_per_cup, d.cup_g),
  grams_per_each = coalesce(i.grams_per_each, d.each_g)
from density_seed d
where lower(trim(i.name)) = any(d.names)
  and i.grams_per_cup is null
  and i.grams_per_each is null;

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type UserRole = 'user' | 'admin'
export type RecipeDifficulty = 'beginner' | 'intermediate' | 'advanced'
export type HowtoSection = 'baking' | 'microbakery'

export interface RecipeIngredient {
  ingredient_id?: string
  ingredient_name: string
  quantity: string
  unit: string
  quantity_grams?: number
  notes?: string
  group_label?: string
}

export interface RecipeInstruction {
  step_number: number
  title?: string
  body: string
}

export interface RecipeFaq {
  question: string
  answer: string
}

export interface HowToStep {
  step_number: number
  title: string
  description: string
}

export type HeadingBlock = { type: 'heading'; id: string; content: string }
export type TextBlock = { type: 'text'; id: string; content: string }
export type ImageBlock = { type: 'image'; id: string; url: string; alt: string; description?: string }
export type NumberedListBlock = { type: 'numbered_list'; id: string; items: string[] }
export type BulletedListBlock = { type: 'bulleted_list'; id: string; items: string[] }
export type ContentBlock = HeadingBlock | TextBlock | ImageBlock | NumberedListBlock | BulletedListBlock

export interface CommonSubstitute {
  name: string
  notes?: string
  ingredient_id?: string
}

export interface NutritionInfo {
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  fiber_g?: number
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          role: UserRole
          mailing_list: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          mailing_list?: boolean
        }
        Update: {
          display_name?: string | null
          avatar_url?: string | null
          mailing_list?: boolean
        }
        Relationships: []
      }
      recipe_categories: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          image_url: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          slug: string
          name: string
          description?: string | null
          image_url?: string | null
          sort_order?: number
        }
        Update: {
          slug?: string
          name?: string
          description?: string | null
          image_url?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      recipe_subcategories: {
        Row: {
          id: string
          category_id: string
          slug: string
          name: string
          description: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          category_id: string
          slug: string
          name: string
          description?: string | null
          sort_order?: number
        }
        Update: {
          category_id?: string
          slug?: string
          name?: string
          description?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          id: string
          slug: string
          name: string
          category: string
          headline: string | null
          image_url: string | null
          image_alt: string | null
          origins: string | null
          how_used_in_baking: string | null
          common_substitutes: CommonSubstitute[]
          storage_tips: string | null
          buying_tips: string | null
          flavor_notes: string | null
          baker_percentage: string | null
          sourcing_notes: string | null
          popular_recipe_ids: string[]
          tags: string[]
          seo_title: string | null
          seo_description: string | null
          published: boolean
          search_vector: unknown
          created_at: string
          updated_at: string
        }
        Insert: {
          slug: string
          name: string
          category: string
          headline?: string | null
          image_url?: string | null
          image_alt?: string | null
          origins?: string | null
          how_used_in_baking?: string | null
          common_substitutes?: CommonSubstitute[]
          storage_tips?: string | null
          buying_tips?: string | null
          flavor_notes?: string | null
          baker_percentage?: string | null
          sourcing_notes?: string | null
          popular_recipe_ids?: string[]
          tags?: string[]
          seo_title?: string | null
          seo_description?: string | null
          published?: boolean
        }
        Update: Partial<Database['public']['Tables']['ingredients']['Insert']>
        Relationships: []
      }
      recipes: {
        Row: {
          id: string
          slug: string
          title: string
          headline: string | null
          category_id: string | null
          subcategory_id: string | null
          difficulty: RecipeDifficulty
          prep_time_minutes: number | null
          cook_time_minutes: number | null
          total_time_minutes: number
          base_yield: string | null
          base_servings: number | null
          ingredients: RecipeIngredient[]
          instructions: RecipeInstruction[]
          tips: string[]
          equipment: string[]
          storage_instructions: string | null
          faqs: RecipeFaq[]
          image_url: string | null
          image_alt: string | null
          tags: string[]
          occasion_tags: string[]
          season_tags: string[]
          dietary_tags: string[]
          has_gluten_free: boolean
          gluten_free_notes: string | null
          gluten_free_ingredients: RecipeIngredient[] | null
          gluten_free_instructions: RecipeInstruction[] | null
          has_high_protein: boolean
          high_protein_notes: string | null
          high_protein_ingredients: RecipeIngredient[] | null
          high_protein_instructions: RecipeInstruction[] | null
          nutrition_per_serving: NutritionInfo | null
          seo_title: string | null
          seo_description: string | null
          published: boolean
          featured: boolean
          search_vector: unknown
          created_at: string
          updated_at: string
        }
        Insert: {
          slug: string
          title: string
          headline?: string | null
          category_id?: string | null
          subcategory_id?: string | null
          difficulty?: RecipeDifficulty
          prep_time_minutes?: number | null
          cook_time_minutes?: number | null
          base_yield?: string | null
          base_servings?: number | null
          ingredients?: RecipeIngredient[]
          instructions?: RecipeInstruction[]
          tips?: string[]
          equipment?: string[]
          storage_instructions?: string | null
          faqs?: RecipeFaq[]
          image_url?: string | null
          image_alt?: string | null
          tags?: string[]
          occasion_tags?: string[]
          season_tags?: string[]
          dietary_tags?: string[]
          has_gluten_free?: boolean
          gluten_free_notes?: string | null
          gluten_free_ingredients?: RecipeIngredient[] | null
          gluten_free_instructions?: RecipeInstruction[] | null
          has_high_protein?: boolean
          high_protein_notes?: string | null
          high_protein_ingredients?: RecipeIngredient[] | null
          high_protein_instructions?: RecipeInstruction[] | null
          nutrition_per_serving?: NutritionInfo | null
          seo_title?: string | null
          seo_description?: string | null
          published?: boolean
          featured?: boolean
        }
        Update: Partial<Database['public']['Tables']['recipes']['Insert']>
        Relationships: []
      }
      howto_articles: {
        Row: {
          id: string
          slug: string
          title: string
          headline: string | null
          section: HowtoSection
          body: string | null
          steps: HowToStep[]
          image_url: string | null
          image_alt: string | null
          related_recipe_ids: string[]
          related_article_ids: string[]
          related_ingredient_ids: string[]
          tags: string[]
          read_time_minutes: number | null
          seo_title: string | null
          seo_description: string | null
          published: boolean
          featured: boolean
          search_vector: unknown
          created_at: string
          updated_at: string
        }
        Insert: {
          slug: string
          title: string
          headline?: string | null
          section: HowtoSection
          body?: string | null
          steps?: HowToStep[]
          image_url?: string | null
          image_alt?: string | null
          related_recipe_ids?: string[]
          related_article_ids?: string[]
          related_ingredient_ids?: string[]
          tags?: string[]
          read_time_minutes?: number | null
          seo_title?: string | null
          seo_description?: string | null
          published?: boolean
          featured?: boolean
        }
        Update: Partial<Database['public']['Tables']['howto_articles']['Insert']>
        Relationships: []
      }
      page_views: {
        Row: {
          id: number
          path: string
          created_at: string
        }
        Insert: { path: string }
        Update: Record<string, never>
        Relationships: []
      }
      saved_recipes: {
        Row: {
          id: string
          user_id: string
          recipe_id: string
          saved_at: string
        }
        Insert: { user_id: string; recipe_id: string }
        Update: Record<string, never>
        Relationships: []
      }
      collections: {
        Row: {
          id: string
          user_id: string
          name: string
          is_public: boolean
          public_slug: string | null
          created_at: string
          updated_at: string
        }
        Insert: { user_id: string; name: string; is_public?: boolean }
        Update: { name?: string; is_public?: boolean }
        Relationships: []
      }
      collection_items: {
        Row: {
          id: string
          collection_id: string
          recipe_id: string
          sort_order: number
          added_at: string
        }
        Insert: { collection_id: string; recipe_id: string; sort_order?: number }
        Update: { sort_order?: number }
        Relationships: []
      }
      grocery_lists: {
        Row: { id: string; user_id: string; created_at: string; updated_at: string }
        Insert: { user_id: string }
        Update: Record<string, never>
        Relationships: []
      }
      grocery_list_items: {
        Row: {
          id: string
          grocery_list_id: string
          recipe_id: string
          scale_factor: number
          added_at: string
        }
        Insert: { grocery_list_id: string; recipe_id: string; scale_factor?: number }
        Update: { scale_factor?: number }
        Relationships: []
      }
      grocery_list_checks: {
        Row: {
          id: string
          grocery_list_id: string
          ingredient_id: string | null
          ingredient_name: string
          is_checked: boolean
        }
        Insert: {
          grocery_list_id: string
          ingredient_id?: string | null
          ingredient_name: string
          is_checked?: boolean
        }
        Update: { is_checked?: boolean }
        Relationships: []
      }
    }
    Views: {
      admin_content_counts: {
        Row: {
          published_recipes: number
          draft_recipes: number
          published_howtos: number
          draft_howtos: number
          published_ingredients: number
          draft_ingredients: number
          total_users: number
          mailing_list_subscribers: number
        }
        Relationships: []
      }
      page_view_stats: {
        Row: {
          views_today: number
          views_7d: number
          views_30d: number
          views_total: number
        }
        Relationships: []
      }
      page_view_top_paths: {
        Row: {
          path: string
          views: number
        }
        Relationships: []
      }
      page_view_monthly: {
        Row: {
          month: string
          views: number
        }
        Relationships: []
      }
      page_view_paths: {
        Row: {
          path: string
          views_today: number
          views_7d: number
          views_30d: number
          views_total: number
        }
        Relationships: []
      }
      recipes_by_tag: {
        Row: {
          tag: string
          id: string
          slug: string
          title: string
          headline: string | null
          image_url: string | null
          difficulty: RecipeDifficulty
          total_time_minutes: number
        }
        Relationships: []
      }
      gluten_free_recipes: {
        Row: {
          id: string
          slug: string
          title: string
          headline: string | null
          image_url: string | null
          category_id: string | null
          difficulty: RecipeDifficulty
          total_time_minutes: number
        }
        Relationships: []
      }
      high_protein_recipes: {
        Row: {
          id: string
          slug: string
          title: string
          headline: string | null
          image_url: string | null
          category_id: string | null
          difficulty: RecipeDifficulty
          total_time_minutes: number
        }
        Relationships: []
      }
      mailing_list_export: {
        Row: { email: string; display_name: string | null; subscribed_at: string }
        Relationships: []
      }
    }
    Functions: {
      search_all: {
        Args: { query: string; result_limit?: number }
        Returns: {
          id: string
          content_type: string
          title: string
          headline: string | null
          slug: string
          image_url: string | null
          rank: number
        }[]
      }
    }
    Enums: {
      user_role: UserRole
      recipe_difficulty: RecipeDifficulty
      howto_section: HowtoSection
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Recipe = Database['public']['Tables']['recipes']['Row']
export type Ingredient = Database['public']['Tables']['ingredients']['Row']
export type HowToArticle = Database['public']['Tables']['howto_articles']['Row']
export type RecipeCategory = Database['public']['Tables']['recipe_categories']['Row']
export type RecipeSubcategory = Database['public']['Tables']['recipe_subcategories']['Row']
export type Collection = Database['public']['Tables']['collections']['Row']
export type GroceryList = Database['public']['Tables']['grocery_lists']['Row']
export type GroceryListItem = Database['public']['Tables']['grocery_list_items']['Row']
export type GroceryListCheck = Database['public']['Tables']['grocery_list_checks']['Row']
export type SearchResult = Database['public']['Functions']['search_all']['Returns'][number]
export type AdminCounts = Database['public']['Views']['admin_content_counts']['Row']
export type PageViewStats = Database['public']['Views']['page_view_stats']['Row']
export type PageViewTopPath = Database['public']['Views']['page_view_top_paths']['Row']
export type PageViewMonthly = Database['public']['Views']['page_view_monthly']['Row']
export type PageViewPath = Database['public']['Views']['page_view_paths']['Row']

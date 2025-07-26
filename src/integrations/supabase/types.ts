export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      availability_slots: {
        Row: {
          created_at: string
          custom_service_name: string | null
          date: string
          discount_price: number | null
          duration: number
          end_time: string
          id: string
          image_url: string | null
          is_booked: boolean | null
          is_recurring: boolean | null
          notes: string | null
          price: number | null
          provider_id: string
          provider_service_id: string | null
          recurrence_pattern: string | null
          service_id: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_service_name?: string | null
          date: string
          discount_price?: number | null
          duration: number
          end_time: string
          id?: string
          image_url?: string | null
          is_booked?: boolean | null
          is_recurring?: boolean | null
          notes?: string | null
          price?: number | null
          provider_id: string
          provider_service_id?: string | null
          recurrence_pattern?: string | null
          service_id?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_service_name?: string | null
          date?: string
          discount_price?: number | null
          duration?: number
          end_time?: string
          id?: string
          image_url?: string | null
          is_booked?: boolean | null
          is_recurring?: boolean | null
          notes?: string | null
          price?: number | null
          provider_id?: string
          provider_service_id?: string | null
          recurrence_pattern?: string | null
          service_id?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "availability_slots_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_availability_slots_provider_service"
            columns: ["provider_service_id"]
            isOneToOne: false
            referencedRelation: "provider_services"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          created_at: string
          customer_id: string
          customer_notes: string | null
          end_time: string
          id: string
          price: number | null
          provider_id: string
          provider_notes: string | null
          service_id: string
          slot_id: string
          start_time: string
          status: string | null
          updated_at: string
        }
        Insert: {
          booking_date: string
          created_at?: string
          customer_id: string
          customer_notes?: string | null
          end_time: string
          id?: string
          price?: number | null
          provider_id: string
          provider_notes?: string | null
          service_id: string
          slot_id: string
          start_time: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          booking_date?: string
          created_at?: string
          customer_id?: string
          customer_notes?: string | null
          end_time?: string
          id?: string
          price?: number | null
          provider_id?: string
          provider_notes?: string | null
          service_id?: string
          slot_id?: string
          start_time?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: true
            referencedRelation: "availability_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      business_categories: {
        Row: {
          category_type: Database["public"]["Enums"]["business_category_type"]
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category_type: Database["public"]["Enums"]["business_category_type"]
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category_type?: Database["public"]["Enums"]["business_category_type"]
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      customer_favourites: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          provider_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          provider_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_favourites_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      local_offers: {
        Row: {
          created_at: string
          current_uses: number
          description: string | null
          discount_amount: number | null
          discount_percentage: number | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_spend: number | null
          offer_code: string | null
          provider_id: string
          service_categories: string[] | null
          target_location: string | null
          title: string
          updated_at: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_spend?: number | null
          offer_code?: string | null
          provider_id: string
          service_categories?: string[] | null
          target_location?: string | null
          title: string
          updated_at?: string
          valid_from?: string
          valid_until: string
        }
        Update: {
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_spend?: number | null
          offer_code?: string | null
          provider_id?: string
          service_categories?: string[] | null
          target_location?: string | null
          title?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "local_offers_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          featured: boolean | null
          id: string
          image_url: string
          is_public: boolean | null
          provider_id: string
          public_slug: string | null
          tags: string[] | null
          template_type: string | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url: string
          is_public?: boolean | null
          provider_id: string
          public_slug?: string | null
          tags?: string[] | null
          template_type?: string | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          image_url?: string
          is_public?: boolean | null
          provider_id?: string
          public_slug?: string | null
          tags?: string[] | null
          template_type?: string | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_portfolio_provider"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_role: Database["public"]["Enums"]["user_role"]
          avatar_url: string | null
          bio: string | null
          consent_date: string | null
          created_at: string
          email: string
          gdpr_consent: boolean | null
          id: string
          is_profile_complete: boolean | null
          location: string | null
          name: string | null
          phone: string | null
          privacy_settings: Json | null
          role: Database["public"]["Enums"]["user_role"]
          terms_accepted: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_role: Database["public"]["Enums"]["user_role"]
          avatar_url?: string | null
          bio?: string | null
          consent_date?: string | null
          created_at?: string
          email: string
          gdpr_consent?: boolean | null
          id?: string
          is_profile_complete?: boolean | null
          location?: string | null
          name?: string | null
          phone?: string | null
          privacy_settings?: Json | null
          role: Database["public"]["Enums"]["user_role"]
          terms_accepted?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_role?: Database["public"]["Enums"]["user_role"]
          avatar_url?: string | null
          bio?: string | null
          consent_date?: string | null
          created_at?: string
          email?: string
          gdpr_consent?: boolean | null
          id?: string
          is_profile_complete?: boolean | null
          location?: string | null
          name?: string | null
          phone?: string | null
          privacy_settings?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          terms_accepted?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_details: {
        Row: {
          availability_notes: string | null
          business_address: string | null
          business_category: string | null
          business_description: string | null
          business_email: string | null
          business_logo_url: string | null
          business_name: string | null
          business_phone: string | null
          business_website: string | null
          certification_files: string[] | null
          certifications: string | null
          cover_image_url: string | null
          coverage_towns: string[] | null
          created_at: string
          emergency_available: boolean | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          insurance_info: string | null
          is_address_public: boolean | null
          operating_hours: string | null
          postcode_area: string | null
          postcode_full: string | null
          postcode_verified_at: string | null
          pricing_info: string | null
          profile_published: boolean | null
          profile_visibility: string | null
          rating: number | null
          service_area: string | null
          services_offered: string[] | null
          social_media_links: Json | null
          tiktok_url: string | null
          total_reviews: number | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          availability_notes?: string | null
          business_address?: string | null
          business_category?: string | null
          business_description?: string | null
          business_email?: string | null
          business_logo_url?: string | null
          business_name?: string | null
          business_phone?: string | null
          business_website?: string | null
          certification_files?: string[] | null
          certifications?: string | null
          cover_image_url?: string | null
          coverage_towns?: string[] | null
          created_at?: string
          emergency_available?: boolean | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          insurance_info?: string | null
          is_address_public?: boolean | null
          operating_hours?: string | null
          postcode_area?: string | null
          postcode_full?: string | null
          postcode_verified_at?: string | null
          pricing_info?: string | null
          profile_published?: boolean | null
          profile_visibility?: string | null
          rating?: number | null
          service_area?: string | null
          services_offered?: string[] | null
          social_media_links?: Json | null
          tiktok_url?: string | null
          total_reviews?: number | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          availability_notes?: string | null
          business_address?: string | null
          business_category?: string | null
          business_description?: string | null
          business_email?: string | null
          business_logo_url?: string | null
          business_name?: string | null
          business_phone?: string | null
          business_website?: string | null
          certification_files?: string[] | null
          certifications?: string | null
          cover_image_url?: string | null
          coverage_towns?: string[] | null
          created_at?: string
          emergency_available?: boolean | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          insurance_info?: string | null
          is_address_public?: boolean | null
          operating_hours?: string | null
          postcode_area?: string | null
          postcode_full?: string | null
          postcode_verified_at?: string | null
          pricing_info?: string | null
          profile_published?: boolean | null
          profile_visibility?: string | null
          rating?: number | null
          service_area?: string | null
          services_offered?: string[] | null
          social_media_links?: Json | null
          tiktok_url?: string | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_business_category"
            columns: ["business_category"]
            isOneToOne: false
            referencedRelation: "business_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      provider_services: {
        Row: {
          base_price: number | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          provider_id: string
          service_name: string
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          provider_id: string
          service_name: string
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          provider_id?: string
          service_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_provider_services_provider"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      services: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          typical_duration: number | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          typical_duration?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          typical_duration?: number | null
        }
        Relationships: []
      }
      social_media_connections: {
        Row: {
          created_at: string
          handle: string
          id: string
          is_active: boolean | null
          platform: string
          profile_picture_url: string | null
          profile_url: string
          provider_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          handle: string
          id?: string
          is_active?: boolean | null
          platform: string
          profile_picture_url?: string | null
          profile_url: string
          provider_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          handle?: string
          id?: string
          is_active?: boolean | null
          platform?: string
          profile_picture_url?: string | null
          profile_url?: string
          provider_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_portfolio_slug: {
        Args: { title: string; provider_id: string }
        Returns: string
      }
    }
    Enums: {
      business_category_type:
        | "beauty_wellness"
        | "health_fitness"
        | "education_training"
        | "professional_services"
        | "home_services"
        | "automotive"
        | "food_beverage"
        | "retail_shopping"
        | "entertainment"
        | "other"
      user_role: "customer" | "provider"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      business_category_type: [
        "beauty_wellness",
        "health_fitness",
        "education_training",
        "professional_services",
        "home_services",
        "automotive",
        "food_beverage",
        "retail_shopping",
        "entertainment",
        "other",
      ],
      user_role: ["customer", "provider"],
    },
  },
} as const

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      budgets: {
        Row: {
          budget_amount: number
          category: string
          created_at: string | null
          currency: string
          id: string
          month: number | null
          period_type: string
          property_id: string
          year: number
        }
        Insert: {
          budget_amount: number
          category: string
          created_at?: string | null
          currency?: string
          id?: string
          month?: number | null
          period_type: string
          property_id: string
          year: number
        }
        Update: {
          budget_amount?: number
          category?: string
          created_at?: string | null
          currency?: string
          id?: string
          month?: number | null
          period_type?: string
          property_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      currency_rates: {
        Row: {
          base_currency: string
          fetched_at: string
          id: string
          rate: number
          source: string | null
          target_currency: string
        }
        Insert: {
          base_currency: string
          fetched_at?: string
          id?: string
          rate: number
          source?: string | null
          target_currency: string
        }
        Update: {
          base_currency?: string
          fetched_at?: string
          id?: string
          rate?: number
          source?: string | null
          target_currency?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          country: string | null
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          address?: string
          country?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Update: {
          address?: string
          country?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      property_members: {
        Row: {
          created_at: string
          property_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          property_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          property_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_members_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          currency: string | null
          email: string | null
          id: string
          lease_end: string | null
          lease_start: string | null
          monthly_rent: number | null
          name: string
          phone: string | null
          property_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          lease_end?: string | null
          lease_start?: string | null
          monthly_rent?: number | null
          name: string
          phone?: string | null
          property_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          email?: string | null
          id?: string
          lease_end?: string | null
          lease_start?: string | null
          monthly_rent?: number | null
          name?: string
          phone?: string | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          created_by: string
          currency: string
          date: string
          description: string | null
          id: string
          normalized_amount: number | null
          normalized_currency: string
          payee_payer: string | null
          property_id: string
          rate_timestamp: string | null
          rate_used: number | null
          type: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          date?: string
          description?: string | null
          id?: string
          normalized_amount?: number | null
          normalized_currency?: string
          payee_payer?: string | null
          property_id: string
          rate_timestamp?: string | null
          rate_used?: number | null
          type?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          date?: string
          description?: string | null
          id?: string
          normalized_amount?: number | null
          normalized_currency?: string
          payee_payer?: string | null
          property_id?: string
          rate_timestamp?: string | null
          rate_used?: number | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_property_manager_or_owner: {
        Args: { p_property_id: string }
        Returns: boolean
      }
      is_property_member: { Args: { p_property_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

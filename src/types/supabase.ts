export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      Admin_Logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          description: string
          id: number
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          description: string
          id?: number
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          description?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "Admin_Logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      Event_Participants: {
        Row: {
          event_id: number
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          event_id: number
          joined_at?: string
          role: string
          user_id: string
        }
        Update: {
          event_id?: number
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Event_Participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "Events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Event_Participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      Event_Ratings: {
        Row: {
          created_at: string
          event_id: number
          id: number
          rating: number
          review: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: number
          id?: number
          rating: number
          review: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: number
          id?: number
          rating?: number
          review?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Event_Ratings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "Events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Event_Ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      Events: {
        Row: {
          created_at: string
          creator_id: string
          description: string
          end_time: string
          event_date: string
          id: number
          location_latitude: number
          location_longitude: number
          location_name: string
          max_participants: number
          sport_id: number
          start_time: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description: string
          end_time: string
          event_date: string
          id?: number
          location_latitude: number
          location_longitude: number
          location_name: string
          max_participants: number
          sport_id: number
          start_time: string
          status: string
          title: string
          updated_at: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string
          end_time?: string
          event_date?: string
          id?: number
          location_latitude?: number
          location_longitude?: number
          location_name?: string
          max_participants?: number
          sport_id?: number
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Events_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "Sports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_sports"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "Sports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_users"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      News: {
        Row: {
          content: string
          created_at: string
          id: number
          image_url: string
          published_date: string
          source_url: string
          sport_id: number
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          image_url: string
          published_date: string
          source_url: string
          sport_id: number
          title: string
          updated_at: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          image_url?: string
          published_date?: string
          source_url?: string
          sport_id?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "News_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "Sports"
            referencedColumns: ["id"]
          },
        ]
      }
      Notifications: {
        Row: {
          content: string
          created_at: string
          event_id: number
          id: number
          notification_type: string
          read_status: boolean
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          event_id: number
          id?: number
          notification_type: string
          read_status?: boolean
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          event_id?: number
          id?: number
          notification_type?: string
          read_status?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "Events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      Reports: {
        Row: {
          admin_notes: string | null
          event_id: number
          id: number
          report_date: string
          report_reason: string
          reported_id: string
          reporter_id: string
          status: string
        }
        Insert: {
          admin_notes?: string | null
          event_id: number
          id?: number
          report_date?: string
          report_reason: string
          reported_id: string
          reporter_id: string
          status: string
        }
        Update: {
          admin_notes?: string | null
          event_id?: number
          id?: number
          report_date?: string
          report_reason?: string
          reported_id?: string
          reporter_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "Reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "Events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Reports_reported_id_fkey"
            columns: ["reported_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      security_logs: {
        Row: {
          action: string
          admin: string
          created_at: string | null
          date: string
          id: string
          ip: string
          status: string
          time: string
          type: string
        }
        Insert: {
          action: string
          admin: string
          created_at?: string | null
          date: string
          id?: string
          ip: string
          status: string
          time: string
          type: string
        }
        Update: {
          action?: string
          admin?: string
          created_at?: string | null
          date?: string
          id?: string
          ip?: string
          status?: string
          time?: string
          type?: string
        }
        Relationships: []
      }
      Sports: {
        Row: {
          description: string
          icon: string
          id: number
          name: string
        }
        Insert: {
          description: string
          icon: string
          id?: number
          name: string
        }
        Update: {
          description?: string
          icon?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      user_favorite_sports: {
        Row: {
          added_at: string
          sport_id: number
          user_id: string
        }
        Insert: {
          added_at?: string
          sport_id: number
          user_id: string
        }
        Update: {
          added_at?: string
          sport_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorite_sports_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "Sports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorite_sports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      User_Ratings: {
        Row: {
          created_at: string
          id: number
          rated_user_id: string
          rating_user_id: string
          rating_value: number
          review_text: string
        }
        Insert: {
          created_at?: string
          id?: number
          rated_user_id: string
          rating_user_id: string
          rating_value: number
          review_text: string
        }
        Update: {
          created_at?: string
          id?: number
          rated_user_id?: string
          rating_user_id?: string
          rating_value?: number
          review_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "User_Ratings_rated_user_id_fkey"
            columns: ["rated_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "User_Ratings_rating_user_id_fkey"
            columns: ["rating_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      User_Sports: {
        Row: {
          skill_level: string
          sport_id: number
          user_id: string
        }
        Insert: {
          skill_level: string
          sport_id: number
          user_id: string
        }
        Update: {
          skill_level?: string
          sport_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "User_Sports_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "Sports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "User_Sports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      User_Warnings: {
        Row: {
          admin_id: string | null
          id: string
          is_read: boolean | null
          message: string
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_id?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          sent_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "User_Warnings_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "User_Warnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          age: number | null
          bio: string | null
          created_at: string
          default_location_latitude: number
          default_location_longitude: number
          email: string
          first_name: string
          gender: string | null
          id: string
          is_watched: boolean
          last_name: string
          phone: string
          profile_picture: string
          role: string
          status: string
          updated_at: string
          username: string
          watched_since: string | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          bio?: string | null
          created_at?: string
          default_location_latitude: number
          default_location_longitude: number
          email: string
          first_name: string
          gender?: string | null
          id: string
          is_watched?: boolean
          last_name: string
          phone: string
          profile_picture: string
          role?: string
          status?: string
          updated_at: string
          username: string
          watched_since?: string | null
        }
        Update: {
          address?: string | null
          age?: number | null
          bio?: string | null
          created_at?: string
          default_location_latitude?: number
          default_location_longitude?: number
          email?: string
          first_name?: string
          gender?: string | null
          id?: string
          is_watched?: boolean
          last_name?: string
          phone?: string
          profile_picture?: string
          role?: string
          status?: string
          updated_at?: string
          username?: string
          watched_since?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_category_participant_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          category_name: string
          participant_count: number
        }[]
      }
      get_weekly_stats: {
        Args: {
          start_date: string // timestamp with time zone
          end_date: string // timestamp with time zone
        }
        Returns: {
            stat_date: string // date
            event_count: number // bigint
            participant_count: number // bigint
        }[]
      }
      get_monthly_event_stats: {
        Args: Record<PropertyKey, never> // No arguments for this function
        Returns: {
          event_month: string // text (YYYY-MM)
          status_counts: Json // jsonb (e.g., {"approved": 5, "pending": 2})
        }[]
      }
      get_user_growth_by_category: {
        Args: {
          period_days: number // integer
        }
        Returns: {
          category_name: string // text
          total_users: number   // bigint (maps to number in TS)
          change: number        // bigint (maps to number in TS)
        }[]
      }
      register: {
        Args: { name: string; email: string; password: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
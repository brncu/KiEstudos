export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          city: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          target_exam: string;
          weekly_goal_hours: number;
        };
        Insert: {
          city?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          target_exam?: string;
          weekly_goal_hours?: number;
        };
        Update: {
          city?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          target_exam?: string;
          weekly_goal_hours?: number;
        };
        Relationships: [];
      };
      question_answers: {
        Row: {
          created_at: string;
          discipline: string;
          id: string;
          is_correct: boolean;
          question_id: string;
          selected_answer: string;
          source: string;
          topic: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          discipline: string;
          id?: string;
          is_correct: boolean;
          question_id: string;
          selected_answer: string;
          source?: string;
          topic: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          discipline?: string;
          id?: string;
          is_correct?: boolean;
          question_id?: string;
          selected_answer?: string;
          source?: string;
          topic?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "question_answers_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "question_bank";
            referencedColumns: ["id"];
          },
        ];
      };
      question_bank: {
        Row: {
          correct_answer: string;
          created_at: string;
          discipline: string;
          explanation: string | null;
          id: string;
          options: Json;
          statement: string;
          topic: string;
        };
        Insert: {
          correct_answer: string;
          created_at?: string;
          discipline: string;
          explanation?: string | null;
          id?: string;
          options: Json;
          statement: string;
          topic: string;
        };
        Update: {
          correct_answer?: string;
          created_at?: string;
          discipline?: string;
          explanation?: string | null;
          id?: string;
          options?: Json;
          statement?: string;
          topic?: string;
        };
        Relationships: [];
      };
      quiz_attempts: {
        Row: {
          attempt_type: string;
          created_at: string;
          discipline: string | null;
          id: string;
          score: number;
          total: number;
          user_id: string;
        };
        Insert: {
          attempt_type?: string;
          created_at?: string;
          discipline?: string | null;
          id?: string;
          score: number;
          total: number;
          user_id: string;
        };
        Update: {
          attempt_type?: string;
          created_at?: string;
          discipline?: string | null;
          id?: string;
          score?: number;
          total?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      study_sessions: {
        Row: {
          created_at: string;
          discipline: string;
          id: string;
          minutes: number;
          note: string | null;
          session_date: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          discipline: string;
          id?: string;
          minutes: number;
          note?: string | null;
          session_date?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          discipline?: string;
          id?: string;
          minutes?: number;
          note?: string | null;
          session_date?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      flashcard_decks: {
        Row: {
          created_at: string;
          discipline: string;
          id: string;
          title: string;
          topic: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          discipline: string;
          id?: string;
          title: string;
          topic?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          discipline?: string;
          id?: string;
          title?: string;
          topic?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      flashcards: {
        Row: {
          back: string;
          created_at: string;
          deck_id: string;
          front: string;
          id: string;
        };
        Insert: {
          back: string;
          created_at?: string;
          deck_id: string;
          front: string;
          id?: string;
        };
        Update: {
          back?: string;
          created_at?: string;
          deck_id?: string;
          front?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey";
            columns: ["deck_id"];
            isOneToOne: false;
            referencedRelation: "flashcard_decks";
            referencedColumns: ["id"];
          },
        ];
      };
      user_flashcard_reviews: {
        Row: {
          card_id: string;
          ease_factor: number;
          id: string;
          interval_days: number;
          last_rating: number;
          next_review_date: string;
          repetitions: number;
          reviewed_at: string;
          user_id: string;
        };
        Insert: {
          card_id: string;
          ease_factor?: number;
          id?: string;
          interval_days?: number;
          last_rating: number;
          next_review_date?: string;
          repetitions?: number;
          reviewed_at?: string;
          user_id: string;
        };
        Update: {
          card_id?: string;
          ease_factor?: number;
          id?: string;
          interval_days?: number;
          last_rating?: number;
          next_review_date?: string;
          repetitions?: number;
          reviewed_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_flashcard_reviews_card_id_fkey";
            columns: ["card_id"];
            isOneToOne: false;
            referencedRelation: "flashcards";
            referencedColumns: ["id"];
          },
        ];
      };
      edital_topics: {
        Row: {
          discipline: string;
          exam_name: string;
          id: string;
          order_index: number;
          topic: string;
          weight: number | null;
        };
        Insert: {
          discipline: string;
          exam_name: string;
          id?: string;
          order_index?: number;
          topic: string;
          weight?: number | null;
        };
        Update: {
          discipline?: string;
          exam_name?: string;
          id?: string;
          order_index?: number;
          topic?: string;
          weight?: number | null;
        };
        Relationships: [];
      };
      user_edital_progress: {
        Row: {
          confidence_level: number;
          exercises_done: number;
          id: string;
          reviews_count: number;
          summary_made: boolean;
          theory_read: boolean;
          topic_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          confidence_level?: number;
          exercises_done?: number;
          id?: string;
          reviews_count?: number;
          summary_made?: boolean;
          theory_read?: boolean;
          topic_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          confidence_level?: number;
          exercises_done?: number;
          id?: string;
          reviews_count?: number;
          summary_made?: boolean;
          theory_read?: boolean;
          topic_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_edital_progress_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "edital_topics";
            referencedColumns: ["id"];
          },
        ];
      };
      question_bookmarks: {
        Row: {
          created_at: string;
          id: string;
          note: string | null;
          question_id: string;
          tag: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          note?: string | null;
          question_id: string;
          tag?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          note?: string | null;
          question_id?: string;
          tag?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "question_bookmarks_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "question_bank";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_discipline_counts: {
        Args: Record<PropertyKey, never>;
        Returns: {
          discipline: string;
          count: number;
        }[];
      };
      get_topics: {
        Args: {
          p_discipline?: string | null;
        };
        Returns: {
          topic: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

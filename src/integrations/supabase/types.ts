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
      ai_conversations: {
        Row: {
          company_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_draft: boolean | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_draft?: boolean | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_draft?: boolean | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          compliance_health: number | null
          created_at: string
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          compliance_health?: number | null
          created_at?: string
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          compliance_health?: number | null
          created_at?: string
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_tasks: {
        Row: {
          assigned_to: string | null
          company_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          regulator: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          regulator: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          regulator?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      deadlines: {
        Row: {
          company_id: string
          created_at: string
          due_date: string
          id: string
          is_recurring: boolean | null
          regulator: string
          title: string
        }
        Insert: {
          company_id: string
          created_at?: string
          due_date: string
          id?: string
          is_recurring?: boolean | null
          regulator: string
          title: string
        }
        Update: {
          company_id?: string
          created_at?: string
          due_date?: string
          id?: string
          is_recurring?: boolean | null
          regulator?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "deadlines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          company_id: string
          created_at: string
          file_path: string | null
          file_type: string | null
          id: string
          name: string
          regulator: string | null
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          file_path?: string | null
          file_type?: string | null
          id?: string
          name: string
          regulator?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          file_path?: string | null
          file_type?: string | null
          id?: string
          name?: string
          regulator?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      regulatory_exposure: {
        Row: {
          company_id: string
          id: string
          notes: string | null
          regulator: string
          status: Database["public"]["Enums"]["regulatory_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          id?: string
          notes?: string | null
          regulator: string
          status?: Database["public"]["Enums"]["regulatory_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          id?: string
          notes?: string | null
          regulator?: string
          status?: Database["public"]["Enums"]["regulatory_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_exposure_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      consent_requests: {
        Row: {
          id: string
          company_id: string | null
          ca_user_id: string
          client_name: string
          client_email: string | null
          client_phone: string | null
          gstin: string | null
          pan: string | null
          cin: string | null
          ca_name: string | null
          consent_status: "pending" | "approved" | "rejected"
          consent_token: string
          email_sent: boolean
          whatsapp_sent: boolean
          responded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          ca_user_id: string
          client_name: string
          client_email?: string | null
          client_phone?: string | null
          gstin?: string | null
          pan?: string | null
          cin?: string | null
          ca_name?: string | null
          consent_status?: "pending" | "approved" | "rejected"
          consent_token?: string
          email_sent?: boolean
          whatsapp_sent?: boolean
          responded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          ca_user_id?: string
          client_name?: string
          client_email?: string | null
          client_phone?: string | null
          gstin?: string | null
          pan?: string | null
          cin?: string | null
          ca_name?: string | null
          consent_status?: "pending" | "approved" | "rejected"
          consent_token?: string
          email_sent?: boolean
          whatsapp_sent?: boolean
          responded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_govt_notices: {
        Row: {
          id: string
          company_id: string
          ca_user_id: string
          department: string
          notice_type: string
          notice_number: string | null
          issue_date: string | null
          due_date: string | null
          financial_year: string | null
          raw_text_content: string | null
          ai_draft_response: string | null
          status: "detected" | "in_progress" | "replied" | "closed"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          ca_user_id: string
          department: string
          notice_type: string
          notice_number?: string | null
          issue_date?: string | null
          due_date?: string | null
          financial_year?: string | null
          raw_text_content?: string | null
          ai_draft_response?: string | null
          status?: "detected" | "in_progress" | "replied" | "closed"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          ca_user_id?: string
          department?: string
          notice_type?: string
          notice_number?: string | null
          issue_date?: string | null
          due_date?: string | null
          financial_year?: string | null
          raw_text_content?: string | null
          ai_draft_response?: string | null
          status?: "detected" | "in_progress" | "replied" | "closed"
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_govt_notices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ca_dependencies: {
        Row: {
          id: string
          company_id: string
          ca_user_id: string
          document_name: string
          description: string | null
          due_date: string | null
          status: "pending" | "uploaded" | "verified"
          urgency: "critical" | "high" | "medium" | "low"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          ca_user_id: string
          document_name: string
          description?: string | null
          due_date?: string | null
          status?: "pending" | "uploaded" | "verified"
          urgency?: "critical" | "high" | "medium" | "low"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          ca_user_id?: string
          document_name?: string
          description?: string | null
          due_date?: string | null
          status?: "pending" | "uploaded" | "verified"
          urgency?: "critical" | "high" | "medium" | "low"
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ca_dependencies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_logs: {
        Row: {
          id: string
          company_id: string | null
          ca_user_id: string
          type: "email" | "whatsapp" | "system" | "sms"
          direction: "inbound" | "outbound" | "system"
          subject: string | null
          content: string
          recipient: string | null
          status: "sent" | "delivered" | "pending" | "failed" | "read"
          ai_agent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          ca_user_id: string
          type?: "email" | "whatsapp" | "system" | "sms"
          direction?: "inbound" | "outbound" | "system"
          subject?: string | null
          content: string
          recipient?: string | null
          status?: "sent" | "delivered" | "pending" | "failed" | "read"
          ai_agent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          ca_user_id?: string
          type?: "email" | "whatsapp" | "system" | "sms"
          direction?: "inbound" | "outbound" | "system"
          subject?: string | null
          content?: string
          recipient?: string | null
          status?: "sent" | "delivered" | "pending" | "failed" | "read"
          ai_agent_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      ca_task_history: {
        Row: {
          id: string
          company_id: string | null
          ca_user_id: string
          task_name: string
          task_type: string | null
          description: string | null
          suggested_fee: number
          is_billed: boolean
          invoice_id: string | null
          completed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          ca_user_id: string
          task_name: string
          task_type?: string | null
          description?: string | null
          suggested_fee?: number
          is_billed?: boolean
          invoice_id?: string | null
          completed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          ca_user_id?: string
          task_name?: string
          task_type?: string | null
          description?: string | null
          suggested_fee?: number
          is_billed?: boolean
          invoice_id?: string | null
          completed_at?: string
          created_at?: string
        }
        Relationships: []
      }
      ca_firm_invoices: {
        Row: {
          id: string
          firm_id: string
          company_id: string | null
          invoice_number: string | null
          invoice_date: string
          due_date: string | null
          total_amount: number
          tax_amount: number | null
          discount_amount: number | null
          payment_status: "draft" | "unpaid" | "paid" | "overdue" | "cancelled"
          payment_received_date: string | null
          line_items: Json
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          firm_id: string
          company_id?: string | null
          invoice_number?: string | null
          invoice_date?: string
          due_date?: string | null
          total_amount?: number
          tax_amount?: number | null
          discount_amount?: number | null
          payment_status?: "draft" | "unpaid" | "paid" | "overdue" | "cancelled"
          payment_received_date?: string | null
          line_items?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          firm_id?: string
          company_id?: string | null
          invoice_number?: string | null
          invoice_date?: string
          due_date?: string | null
          total_amount?: number
          tax_amount?: number | null
          discount_amount?: number | null
          payment_status?: "draft" | "unpaid" | "paid" | "overdue" | "cancelled"
          payment_received_date?: string | null
          line_items?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_financial_books: {
        Row: {
          id: string
          company_id: string
          ca_user_id: string
          financial_year: string
          book_type: string
          book_data: Json
          summary_metrics: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          ca_user_id: string
          financial_year: string
          book_type: string
          book_data?: Json
          summary_metrics?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          ca_user_id?: string
          financial_year?: string
          book_type?: string
          book_data?: Json
          summary_metrics?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_financial_books_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      client_module_calculations: {
        Row: {
          id: string
          company_id: string
          ca_user_id: string
          financial_year: string
          module_id: string
          module_label: string
          calculation_data: Json
          summary: string | null
          status: "pending" | "in_progress" | "completed" | "filed"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          ca_user_id: string
          financial_year: string
          module_id: string
          module_label: string
          calculation_data?: Json
          summary?: string | null
          status?: "pending" | "in_progress" | "completed" | "filed"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          ca_user_id?: string
          financial_year?: string
          module_id?: string
          module_label?: string
          calculation_data?: Json
          summary?: string | null
          status?: "pending" | "in_progress" | "completed" | "filed"
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_module_calculations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notice_data_room: {
        Row: {
          id: string
          company_id: string
          ca_user_id: string
          financial_year: string
          readiness_score: number
          total_modules_completed: number
          executive_summary: string | null
          key_financials: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          ca_user_id: string
          financial_year: string
          readiness_score?: number
          total_modules_completed?: number
          executive_summary?: string | null
          key_financials?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          ca_user_id?: string
          financial_year?: string
          readiness_score?: number
          total_modules_completed?: number
          executive_summary?: string | null
          key_financials?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notice_data_room_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ca_clients: {
        Row: {
          id: string
          ca_user_id: string
          company_id: string | null
          company_name: string
          gstin: string | null
          pan: string | null
          cin: string | null
          contact_email: string | null
          contact_phone: string | null
          industry: string | null
          compliance_health_score: number | null
          risk_level: "Low" | "Medium" | "High" | null
          status: "active" | "inactive" | "pending" | "waiting_for_client"
          onboarded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ca_user_id: string
          company_id?: string | null
          company_name: string
          gstin?: string | null
          pan?: string | null
          cin?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          industry?: string | null
          compliance_health_score?: number | null
          risk_level?: "Low" | "Medium" | "High" | null
          status?: "active" | "inactive" | "pending" | "waiting_for_client"
          onboarded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ca_user_id?: string
          company_id?: string | null
          company_name?: string
          gstin?: string | null
          pan?: string | null
          cin?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          industry?: string | null
          compliance_health_score?: number | null
          risk_level?: "Low" | "Medium" | "High" | null
          status?: "active" | "inactive" | "pending" | "waiting_for_client"
          onboarded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_trail_events: {
        Row: {
          id: string
          ca_user_id: string
          company_id: string | null
          event_type: string
          entity_type: string | null
          entity_id: string | null
          action: string
          old_values: Json | null
          new_values: Json | null
          metadata: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ca_user_id: string
          company_id?: string | null
          event_type: string
          entity_type?: string | null
          entity_id?: string | null
          action: string
          old_values?: Json | null
          new_values?: Json | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ca_user_id?: string
          company_id?: string | null
          event_type?: string
          entity_type?: string | null
          entity_id?: string | null
          action?: string
          old_values?: Json | null
          new_values?: Json | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
      compliance_scores: {
        Row: {
          id: string
          ca_user_id: string
          company_id: string
          score: number
          score_date: string
          breakdown: Json
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ca_user_id: string
          company_id: string
          score: number
          score_date?: string
          breakdown?: Json
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ca_user_id?: string
          company_id?: string
          score?: number
          score_date?: string
          breakdown?: Json
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      compliance_reports: {
        Row: {
          id: string
          ca_user_id: string
          company_id: string | null
          report_name: string
          report_type: string
          period_from: string | null
          period_to: string | null
          content: Json
          file_path: string | null
          status: "draft" | "generated" | "published" | "archived"
          generated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ca_user_id: string
          company_id?: string | null
          report_name: string
          report_type: string
          period_from?: string | null
          period_to?: string | null
          content?: Json
          file_path?: string | null
          status?: "draft" | "generated" | "published" | "archived"
          generated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ca_user_id?: string
          company_id?: string | null
          report_name?: string
          report_type?: string
          period_from?: string | null
          period_to?: string | null
          content?: Json
          file_path?: string | null
          status?: "draft" | "generated" | "published" | "archived"
          generated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_retention_policies: {
        Row: {
          id: string
          ca_user_id: string
          policy_name: string
          entity_type: string
          retention_days: number
          auto_delete: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ca_user_id: string
          policy_name: string
          entity_type: string
          retention_days?: number
          auto_delete?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ca_user_id?: string
          policy_name?: string
          entity_type?: string
          retention_days?: number
          auto_delete?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_alert_subscriptions: {
        Row: {
          id: string
          ca_user_id: string
          alert_type: string
          conditions: Json
          channels: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ca_user_id: string
          alert_type: string
          conditions?: Json
          channels?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ca_user_id?: string
          alert_type?: string
          conditions?: Json
          channels?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      compliance_calendar_events: {
        Row: {
          id: string
          ca_user_id: string
          company_id: string | null
          title: string
          description: string | null
          event_type: "deadline" | "filing" | "payment" | "meeting" | "reminder" | "holiday"
          event_date: string
          due_date: string | null
          regulator: string | null
          priority: "critical" | "high" | "medium" | "low"
          status: "pending" | "in_progress" | "completed" | "overdue" | "cancelled"
          recurrence: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ca_user_id: string
          company_id?: string | null
          title: string
          description?: string | null
          event_type?: "deadline" | "filing" | "payment" | "meeting" | "reminder" | "holiday"
          event_date: string
          due_date?: string | null
          regulator?: string | null
          priority?: "critical" | "high" | "medium" | "low"
          status?: "pending" | "in_progress" | "completed" | "overdue" | "cancelled"
          recurrence?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ca_user_id?: string
          company_id?: string | null
          title?: string
          description?: string | null
          event_type?: "deadline" | "filing" | "payment" | "meeting" | "reminder" | "holiday"
          event_date?: string
          due_date?: string | null
          regulator?: string | null
          priority?: "critical" | "high" | "medium" | "low"
          status?: "pending" | "in_progress" | "completed" | "overdue" | "cancelled"
          recurrence?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      deadline_reminders: {
        Row: {
          id: string
          ca_user_id: string
          event_id: string | null
          company_id: string | null
          reminder_type: "email" | "whatsapp" | "sms" | "in_app"
          remind_at: string
          message: string | null
          is_sent: boolean
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ca_user_id: string
          event_id?: string | null
          company_id?: string | null
          reminder_type?: "email" | "whatsapp" | "sms" | "in_app"
          remind_at: string
          message?: string | null
          is_sent?: boolean
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ca_user_id?: string
          event_id?: string | null
          company_id?: string | null
          reminder_type?: "email" | "whatsapp" | "sms" | "in_app"
          remind_at?: string
          message?: string | null
          is_sent?: boolean
          sent_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      escalation_rules: {
        Row: {
          id: string
          ca_user_id: string
          rule_name: string
          trigger_condition: string
          escalate_to: string | null
          channels: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ca_user_id: string
          rule_name: string
          trigger_condition: string
          escalate_to?: string | null
          channels?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ca_user_id?: string
          rule_name?: string
          trigger_condition?: string
          escalate_to?: string | null
          channels?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      escalation_logs: {
        Row: {
          id: string
          ca_user_id: string
          rule_id: string | null
          event_id: string | null
          company_id: string | null
          triggered_at: string
          resolved_at: string | null
          outcome: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ca_user_id: string
          rule_id?: string | null
          event_id?: string | null
          company_id?: string | null
          triggered_at?: string
          resolved_at?: string | null
          outcome?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ca_user_id?: string
          rule_id?: string | null
          event_id?: string | null
          company_id?: string | null
          triggered_at?: string
          resolved_at?: string | null
          outcome?: string | null
          created_at?: string
        }
        Relationships: []
      }
      lawyer_review_requests: {
        Row: {
          id: string
          ca_user_id: string
          company_id: string | null
          draft_id: string | null
          notice_id: string | null
          request_type: string
          priority: "critical" | "high" | "medium" | "low"
          description: string | null
          draft_content: string | null
          lawyer_notes: string | null
          status: "pending" | "assigned" | "in_review" | "completed" | "rejected"
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ca_user_id: string
          company_id?: string | null
          draft_id?: string | null
          notice_id?: string | null
          request_type?: string
          priority?: "critical" | "high" | "medium" | "low"
          description?: string | null
          draft_content?: string | null
          lawyer_notes?: string | null
          status?: "pending" | "assigned" | "in_review" | "completed" | "rejected"
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ca_user_id?: string
          company_id?: string | null
          draft_id?: string | null
          notice_id?: string | null
          request_type?: string
          priority?: "critical" | "high" | "medium" | "low"
          description?: string | null
          draft_content?: string | null
          lawyer_notes?: string | null
          status?: "pending" | "assigned" | "in_review" | "completed" | "rejected"
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      draft_runs: {
        Row: {
          id: string
          ca_user_id: string
          company_id: string | null
          notice_id: string | null
          document_type: string
          draft_mode: "ai" | "manual" | "template"
          draft_content: string | null
          status: "pending" | "generating" | "generated" | "under_review" | "approved" | "rejected"
          ca_action: string | null
          content_hash: string | null
          worm_seal: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ca_user_id: string
          company_id?: string | null
          notice_id?: string | null
          document_type: string
          draft_mode?: "ai" | "manual" | "template"
          draft_content?: string | null
          status?: "pending" | "generating" | "generated" | "under_review" | "approved" | "rejected"
          ca_action?: string | null
          content_hash?: string | null
          worm_seal?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ca_user_id?: string
          company_id?: string | null
          notice_id?: string | null
          document_type?: string
          draft_mode?: "ai" | "manual" | "template"
          draft_content?: string | null
          status?: "pending" | "generating" | "generated" | "under_review" | "approved" | "rejected"
          ca_action?: string | null
          content_hash?: string | null
          worm_seal?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ca_firm_members: {
        Row: {
          id: string
          firm_id: string
          user_id: string
          name: string | null
          email: string | null
          role: "partner" | "manager" | "associate" | "intern" | "admin"
          status: "active" | "inactive" | "pending"
          joined_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          firm_id: string
          user_id: string
          name?: string | null
          email?: string | null
          role?: "partner" | "manager" | "associate" | "intern" | "admin"
          status?: "active" | "inactive" | "pending"
          joined_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          firm_id?: string
          user_id?: string
          name?: string | null
          email?: string | null
          role?: "partner" | "manager" | "associate" | "intern" | "admin"
          status?: "active" | "inactive" | "pending"
          joined_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ca_firm_clients: {
        Row: {
          id: string
          firm_id: string
          company_id: string | null
          client_name: string
          gstin: string | null
          pan: string | null
          email: string | null
          phone: string | null
          status: "active" | "inactive" | "pending" | "onboarding"
          risk_level: "Low" | "Medium" | "High" | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          firm_id: string
          company_id?: string | null
          client_name: string
          gstin?: string | null
          pan?: string | null
          email?: string | null
          phone?: string | null
          status?: "active" | "inactive" | "pending" | "onboarding"
          risk_level?: "Low" | "Medium" | "High" | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          firm_id?: string
          company_id?: string | null
          client_name?: string
          gstin?: string | null
          pan?: string | null
          email?: string | null
          phone?: string | null
          status?: "active" | "inactive" | "pending" | "onboarding"
          risk_level?: "Low" | "Medium" | "High" | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ca_assignments: {
        Row: {
          id: string
          firm_id: string
          firm_member_id: string | null
          firm_client_id: string
          assignment_type: string | null
          status: "active" | "completed" | "cancelled"
          assigned_at: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          firm_id: string
          firm_member_id?: string | null
          firm_client_id: string
          assignment_type?: string | null
          status?: "active" | "completed" | "cancelled"
          assigned_at?: string
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          firm_id?: string
          firm_member_id?: string | null
          firm_client_id?: string
          assignment_type?: string | null
          status?: "active" | "completed" | "cancelled"
          assigned_at?: string
          completed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      upcoming_deadlines_detailed: {
        Row: {
          id: string | null
          ca_user_id: string | null
          company_id: string | null
          company_name: string | null
          title: string | null
          event_type: string | null
          event_date: string | null
          due_date: string | null
          regulator: string | null
          priority: string | null
          status: string | null
          days_remaining: number | null
        }
        Relationships: []
      }
      calendar_dashboard_summary: {
        Row: {
          ca_user_id: string | null
          pending_count: number | null
          overdue_count: number | null
          due_today_count: number | null
          due_this_week_count: number | null
        }
        Relationships: []
      }

    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_member: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "user"
      document_status: "approved" | "submitted" | "under_review" | "draft"
      regulatory_status: "active" | "not_applicable" | "potential" | "evaluated"
      task_priority: "critical" | "high" | "medium" | "low"
      task_status:
        | "pending"
        | "in_progress"
        | "under_review"
        | "completed"
        | "overdue"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

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
      app_role: ["admin", "manager", "user"],
      document_status: ["approved", "submitted", "under_review", "draft"],
      regulatory_status: ["active", "not_applicable", "potential", "evaluated"],
      task_priority: ["critical", "high", "medium", "low"],
      task_status: [
        "pending",
        "in_progress",
        "under_review",
        "completed",
        "overdue",
      ],
    },
  },
} as const

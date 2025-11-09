export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          settings: Record<string, any>;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          settings?: Record<string, any>;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          settings?: Record<string, any>;
        };
      };
      users: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          full_name?: string | null;
          created_at?: string;
        };
      };
      complaints: {
        Row: {
          id: string;
          organization_id: string;
          created_by: string;
          client_reference: string;
          status: 'assessment' | 'draft' | 'active' | 'escalated' | 'resolved' | 'closed';
          complaint_type: string | null;
          hmrc_department: string | null;
          created_at: string;
          updated_at: string;
          timeline: any[];
          metadata: Record<string, any>;
        };
        Insert: {
          id?: string;
          organization_id: string;
          created_by: string;
          client_reference: string;
          status?: 'assessment' | 'draft' | 'active' | 'escalated' | 'resolved' | 'closed';
          complaint_type?: string | null;
          hmrc_department?: string | null;
          created_at?: string;
          updated_at?: string;
          timeline?: any[];
          metadata?: Record<string, any>;
        };
        Update: {
          id?: string;
          organization_id?: string;
          created_by?: string;
          client_reference?: string;
          status?: 'assessment' | 'draft' | 'active' | 'escalated' | 'resolved' | 'closed';
          complaint_type?: string | null;
          hmrc_department?: string | null;
          created_at?: string;
          updated_at?: string;
          timeline?: any[];
          metadata?: Record<string, any>;
        };
      };
      documents: {
        Row: {
          id: string;
          complaint_id: string;
          document_type: 'hmrc_letter' | 'complaint_draft' | 'response' | 'evidence' | 'final_outcome';
          file_path: string | null;
          uploaded_at: string;
          processed_data: any | null;
          vector_id: string | null;
        };
        Insert: {
          id?: string;
          complaint_id: string;
          document_type: 'hmrc_letter' | 'complaint_draft' | 'response' | 'evidence' | 'final_outcome';
          file_path?: string | null;
          uploaded_at?: string;
          processed_data?: any | null;
          vector_id?: string | null;
        };
        Update: {
          id?: string;
          complaint_id?: string;
          document_type?: 'hmrc_letter' | 'complaint_draft' | 'response' | 'evidence' | 'final_outcome';
          file_path?: string | null;
          uploaded_at?: string;
          processed_data?: any | null;
          vector_id?: string | null;
        };
      };
      knowledge_base: {
        Row: {
          id: string;
          category: string;
          title: string;
          content: string;
          source: string | null;
          embedding: number[];
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          title: string;
          content: string;
          source?: string | null;
          embedding: number[];
          metadata?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          title?: string;
          content?: string;
          source?: string | null;
          embedding?: number[];
          metadata?: Record<string, any>;
          created_at?: string;
        };
      };
      precedents: {
        Row: {
          id: string;
          complaint_type: string;
          issue_category: string;
          outcome: string | null;
          resolution_time_days: number | null;
          compensation_amount: number | null;
          key_arguments: string[];
          effective_citations: string[];
          embedding: number[];
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          complaint_type: string;
          issue_category: string;
          outcome?: string | null;
          resolution_time_days?: number | null;
          compensation_amount?: number | null;
          key_arguments: string[];
          effective_citations: string[];
          embedding: number[];
          metadata?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          complaint_type?: string;
          issue_category?: string;
          outcome?: string | null;
          resolution_time_days?: number | null;
          compensation_amount?: number | null;
          key_arguments?: string[];
          effective_citations?: string[];
          embedding?: number[];
          metadata?: Record<string, any>;
          created_at?: string;
        };
      };
      time_logs: {
        Row: {
          id: string;
          complaint_id: string;
          activity_type: string;
          minutes_spent: number;
          automated: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          complaint_id: string;
          activity_type: string;
          minutes_spent: number;
          automated?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          complaint_id?: string;
          activity_type?: string;
          minutes_spent?: number;
          automated?: boolean;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          data_type: string | null;
          timestamp: string;
          metadata: Record<string, any>;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          data_type?: string | null;
          timestamp?: string;
          metadata?: Record<string, any>;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          data_type?: string | null;
          timestamp?: string;
          metadata?: Record<string, any>;
        };
      };
    };
  };
}


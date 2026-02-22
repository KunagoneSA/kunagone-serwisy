export type AssetType = 'vehicle' | 'equipment' | 'infrastructure'
export type ServiceStatus = 'done' | 'pending' | 'waiting' | 'external' | 'postponed'
export type DeadlineType = 'insurance' | 'inspection' | 'homologation' | 'service' | 'other'
export type AuditAction = 'insert' | 'update' | 'delete'

export interface Asset {
  id: string
  name: string
  identifier: string
  type: AssetType
  notes: string | null
  metadata: Record<string, string>
  created_at: string
  created_by: string | null
}

export interface ServiceEntry {
  id: string
  asset_id: string
  date: string
  description: string
  status: ServiceStatus
  mileage: number | null
  notes: string | null
  priority: number | null
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

export interface Deadline {
  id: string
  asset_id: string
  type: DeadlineType
  title: string
  due_date: string
  is_recurring: boolean
  recurrence_rule: string | null
  notify_days_before: number[]
  completed: boolean
  completed_at: string | null
  completed_by: string | null
  created_at: string
  created_by: string | null
}

export interface AuditLogEntry {
  id: string
  table_name: string
  record_id: string
  action: AuditAction
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  user_id: string | null
  created_at: string
}

export interface PushSubscription {
  id: string
  user_id: string
  subscription: Record<string, unknown>
  created_at: string
}

export interface NotificationSettings {
  id: string
  user_id: string
  email_enabled: boolean
  push_enabled: boolean
  notify_days: number[]
}

export type Database = {
  public: {
    Tables: {
      assets: {
        Row: Asset
        Insert: Omit<Asset, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Asset, 'id'>>
      }
      service_entries: {
        Row: ServiceEntry
        Insert: Omit<ServiceEntry, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<ServiceEntry, 'id'>>
      }
      deadlines: {
        Row: Deadline
        Insert: Omit<Deadline, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Deadline, 'id'>>
      }
      audit_log: {
        Row: AuditLogEntry
        Insert: Omit<AuditLogEntry, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: never
      }
      push_subscriptions: {
        Row: PushSubscription
        Insert: Omit<PushSubscription, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<PushSubscription, 'id'>>
      }
      notification_settings: {
        Row: NotificationSettings
        Insert: Omit<NotificationSettings, 'id'> & { id?: string }
        Update: Partial<Omit<NotificationSettings, 'id'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      asset_type: AssetType
      service_status: ServiceStatus
      deadline_type: DeadlineType
      audit_action: AuditAction
    }
  }
}

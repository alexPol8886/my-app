export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          home_location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          avatar_url?: string | null
          home_location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          avatar_url?: string | null
          home_location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      circles: {
        Row: {
          id: string
          name: string
          description: string | null
          invite_code: string
          creator_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          invite_code: string
          creator_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          invite_code?: string
          creator_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      circle_members: {
        Row: {
          circle_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          circle_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          circle_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
      events: {
        Row: {
          id: string
          circle_id: string
          title: string
          description: string | null
          location_name: string
          location_lat: number | null
          location_lng: number | null
          start_time: string
          end_time: string | null
          creator_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          circle_id: string
          title: string
          description?: string | null
          location_name: string
          location_lat?: number | null
          location_lng?: number | null
          start_time: string
          end_time?: string | null
          creator_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          circle_id?: string
          title?: string
          description?: string | null
          location_name?: string
          location_lat?: number | null
          location_lng?: number | null
          start_time?: string
          end_time?: string | null
          creator_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      event_attendees: {
        Row: {
          event_id: string
          user_id: string
          status: string
          responded_at: string
        }
        Insert: {
          event_id: string
          user_id: string
          status?: string
          responded_at?: string
        }
        Update: {
          event_id?: string
          user_id?: string
          status?: string
          responded_at?: string
        }
      }
      rides: {
        Row: {
          id: string
          event_id: string
          driver_id: string
          origin_text: string
          origin_lat: number | null
          origin_lng: number | null
          total_seats: number
          remaining_seats: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          driver_id: string
          origin_text: string
          origin_lat?: number | null
          origin_lng?: number | null
          total_seats: number
          remaining_seats: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          driver_id?: string
          origin_text?: string
          origin_lat?: number | null
          origin_lng?: number | null
          total_seats?: number
          remaining_seats?: number
          created_at?: string
          updated_at?: string
        }
      }
      ride_passengers: {
        Row: {
          ride_id: string
          passenger_id: string
          pickup_location: string | null
          joined_at: string
        }
        Insert: {
          ride_id: string
          passenger_id: string
          pickup_location?: string | null
          joined_at?: string
        }
        Update: {
          ride_id?: string
          passenger_id?: string
          pickup_location?: string | null
          joined_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      join_ride: {
        Args: {
          p_ride_id: string
          p_passenger_id: string
          p_pickup_location?: string
        }
        Returns: {
          success: boolean
          message: string
        }[]
      }
      leave_ride: {
        Args: {
          p_ride_id: string
          p_passenger_id: string
        }
        Returns: {
          success: boolean
          message: string
        }[]
      }
      generate_invite_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
  }
}

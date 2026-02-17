// Domain types for CircleSync
export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  home_location?: string;
  created_at: string;
  updated_at: string;
}

export interface Circle {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  creator_id: string;
  is_private: boolean;
  who_can_invite: 'admin' | 'all';
  who_can_create_events: 'admin' | 'all';
  created_at: string;
  updated_at: string;
}

export interface CircleMember {
  circle_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface Event {
  id: string;
  circle_id: string;
  title: string;
  description?: string;
  location_name: string;
  location_lat?: number;
  location_lng?: number;
  start_time: string;
  end_time?: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

export interface EventAttendee {
  event_id: string;
  user_id: string;
  status: 'going' | 'maybe' | 'declined';
  responded_at: string;
}

export interface Ride {
  id: string;
  event_id: string;
  driver_id: string;
  origin_text: string;
  origin_lat?: number;
  origin_lng?: number;
  total_seats: number;
  remaining_seats: number;
  created_at: string;
  updated_at: string;
}

export interface RidePassenger {
  ride_id: string;
  passenger_id: string;
  pickup_location?: string;
  joined_at: string;
}

export type AttendanceStatus = 'going' | 'maybe' | 'declined';
export type MemberRole = 'admin' | 'member';

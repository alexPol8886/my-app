-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  home_location TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Circles table
CREATE TABLE IF NOT EXISTS circles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on circles
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;

-- Circle members table
CREATE TABLE IF NOT EXISTS circle_members (
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (circle_id, user_id)
);

-- Enable RLS on circle_members
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location_name TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Event attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'maybe' CHECK (status IN ('going', 'maybe', 'declined')),
  responded_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- Enable RLS on event_attendees
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Rides table
CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  origin_text TEXT NOT NULL,
  origin_lat DECIMAL(10, 8),
  origin_lng DECIMAL(11, 8),
  total_seats INT NOT NULL CHECK (total_seats > 0),
  remaining_seats INT NOT NULL CHECK (remaining_seats >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on rides
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

-- Ride passengers table
CREATE TABLE IF NOT EXISTS ride_passengers (
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pickup_location TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (ride_id, passenger_id)
);

-- Enable RLS on ride_passengers
ALTER TABLE ride_passengers ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_circles_creator_id ON circles(creator_id);
CREATE INDEX IF NOT EXISTS idx_circles_invite_code ON circles(invite_code);
CREATE INDEX IF NOT EXISTS idx_circle_members_user_id ON circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_events_circle_id ON events(circle_id);
CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_rides_event_id ON rides(event_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_ride_passengers_passenger_id ON ride_passengers(passenger_id);

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view profiles in their circles" ON profiles;
CREATE POLICY "Users can view profiles in their circles" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT user_id FROM circle_members
      WHERE circle_id IN (
        SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for circles - simplified to avoid recursion
DROP POLICY IF EXISTS "Users can read circles they created" ON circles;
CREATE POLICY "Users can read circles they created" ON circles
  FOR SELECT USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "Users can read circles they are members of" ON circles;
CREATE POLICY "Users can read circles they are members of" ON circles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_id = id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create circles" ON circles;
CREATE POLICY "Users can create circles" ON circles
  FOR INSERT WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "Circle creators can update circles" ON circles;
CREATE POLICY "Circle creators can update circles" ON circles
  FOR UPDATE USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete circles" ON circles;
CREATE POLICY "Users can delete circles" ON circles
  FOR DELETE USING (creator_id = auth.uid());

-- RLS Policies for circle_members - simplified
DROP POLICY IF EXISTS "Users can view circle members in their circles" ON circle_members;
CREATE POLICY "Users can view circle members in their circles" ON circle_members
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can join circles with invite code" ON circle_members;
CREATE POLICY "Users can join circles with invite code" ON circle_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage circle members" ON circle_members;
CREATE POLICY "Admins can manage circle members" ON circle_members
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their membership" ON circle_members;
CREATE POLICY "Users can delete their membership" ON circle_members
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for events - simplified
DROP POLICY IF EXISTS "Users can read events in their circles" ON events;
CREATE POLICY "Users can read events in their circles" ON events
  FOR SELECT USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "Users can create events in circles" ON events;
CREATE POLICY "Users can create events in circles" ON events
  FOR INSERT WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "Event creators can update events" ON events;
CREATE POLICY "Event creators can update events" ON events
  FOR UPDATE USING (creator_id = auth.uid());

-- RLS Policies for event_attendees - simplified
DROP POLICY IF EXISTS "Users can read event attendees" ON event_attendees;
CREATE POLICY "Users can read event attendees" ON event_attendees
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can respond to events" ON event_attendees;
CREATE POLICY "Users can respond to events" ON event_attendees
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their event response" ON event_attendees;
CREATE POLICY "Users can update their event response" ON event_attendees
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for rides - simplified
DROP POLICY IF EXISTS "Users can read rides for events they attend" ON rides;
CREATE POLICY "Users can read rides for events they attend" ON rides
  FOR SELECT USING (driver_id = auth.uid());

DROP POLICY IF EXISTS "Users can create rides for events they attend" ON rides;
CREATE POLICY "Users can create rides for events they attend" ON rides
  FOR INSERT WITH CHECK (driver_id = auth.uid());

-- RLS Policies for ride_passengers - simplified
DROP POLICY IF EXISTS "Users can view ride passengers" ON ride_passengers;
CREATE POLICY "Users can view ride passengers" ON ride_passengers
  FOR SELECT USING (passenger_id = auth.uid());

DROP POLICY IF EXISTS "Users can join rides" ON ride_passengers;
CREATE POLICY "Users can join rides" ON ride_passengers
  FOR INSERT WITH CHECK (passenger_id = auth.uid());

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup (drop if exists first)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to safely join a ride (atomic operation)
CREATE OR REPLACE FUNCTION public.join_ride(
  p_ride_id UUID,
  p_passenger_id UUID,
  p_pickup_location TEXT DEFAULT NULL
)
RETURNS TABLE (success BOOLEAN, message TEXT) AS $$
DECLARE
  v_remaining_seats INT;
  v_ride_exists BOOLEAN;
BEGIN
  -- Check if ride exists and user has permission
  IF NOT EXISTS (
    SELECT 1 FROM rides r
    WHERE r.id = p_ride_id
    AND EXISTS (
      SELECT 1 FROM event_attendees ea
      WHERE ea.event_id = r.event_id AND ea.user_id = p_passenger_id AND ea.status = 'going'
    )
  ) THEN
    RETURN QUERY SELECT FALSE, 'Ride not found or unauthorized access'::TEXT;
    RETURN;
  END IF;

  -- Check if user is already a passenger
  IF EXISTS (
    SELECT 1 FROM ride_passengers WHERE ride_id = p_ride_id AND passenger_id = p_passenger_id
  ) THEN
    RETURN QUERY SELECT FALSE, 'Already joined this ride'::TEXT;
    RETURN;
  END IF;

  -- Use transaction to ensure atomicity
  BEGIN
    -- Check and decrement seats atomically
    UPDATE rides
    SET remaining_seats = remaining_seats - 1,
        updated_at = now()
    WHERE id = p_ride_id
    AND remaining_seats > 0;

    IF NOT FOUND THEN
      RETURN QUERY SELECT FALSE, 'No available seats'::TEXT;
      RETURN;
    END IF;

    -- Add passenger
    INSERT INTO ride_passengers (ride_id, passenger_id, pickup_location)
    VALUES (p_ride_id, p_passenger_id, p_pickup_location);

    RETURN QUERY SELECT TRUE, 'Successfully joined ride'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 'Error while joining ride'::TEXT;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to leave a ride
CREATE OR REPLACE FUNCTION public.leave_ride(
  p_ride_id UUID,
  p_passenger_id UUID
)
RETURNS TABLE (success BOOLEAN, message TEXT) AS $$
BEGIN
  -- Check if passenger exists in ride
  IF NOT EXISTS (
    SELECT 1 FROM ride_passengers WHERE ride_id = p_ride_id AND passenger_id = p_passenger_id
  ) THEN
    RETURN QUERY SELECT FALSE, 'Not a passenger in this ride'::TEXT;
    RETURN;
  END IF;

  BEGIN
    -- Delete passenger
    DELETE FROM ride_passengers WHERE ride_id = p_ride_id AND passenger_id = p_passenger_id;

    -- Increment available seats
    UPDATE rides
    SET remaining_seats = remaining_seats + 1,
        updated_at = now()
    WHERE id = p_ride_id;

    RETURN QUERY SELECT TRUE, 'Successfully left ride'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 'Error while leaving ride'::TEXT;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
BEGIN
  RETURN substr(md5(random()::text || clock_timestamp()::text), 1, 8);
END;
$$ LANGUAGE plpgsql;

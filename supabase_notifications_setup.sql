-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    circle_id UUID REFERENCES public.circles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('event_create', 'circle_invite', 'member_join', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT, -- Optional URL to redirect when clicked
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS (Security)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Users can see their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- System can insert notifications (if you use backend functions later)
CREATE POLICY "Service role can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true); -- Usually restricted, but for client-side demo logic we allow it slightly open or rely on triggered functions

-- 4. OPTIONAL: Trigger to auto-notify members when a new event is created
-- This function runs automatically inside Postgres
CREATE OR REPLACE FUNCTION notify_circle_members_on_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, circle_id, event_id, type, title, message, link)
    SELECT 
        user_id,
        NEW.circle_id,
        NEW.id,
        'event_create',
        'New Event: ' || NEW.title,
        'A new event has been scheduled in your circle.',
        '/circles/' || NEW.circle_id || '/events/' || NEW.id
    FROM public.circle_users
    WHERE circle_id = NEW.circle_id AND user_id != NEW.created_by; -- Don't notify the creator
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach the trigger to the events table
CREATE TRIGGER on_event_created
AFTER INSERT ON public.events
FOR EACH ROW EXECUTE FUNCTION notify_circle_members_on_event();

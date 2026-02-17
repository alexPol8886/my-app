-- Fix circle_members RLS policy to allow viewing all members in your circles

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view circle members in their circles" ON circle_members;

-- Create new policy that allows viewing all members in circles you belong to
CREATE POLICY "Users can view circle members in their circles" ON circle_members
  FOR SELECT USING (
    circle_id IN (
      SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
    )
    OR
    circle_id IN (
      SELECT id FROM circles WHERE creator_id = auth.uid()
    )
  );

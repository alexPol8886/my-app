-- Add circle settings columns
ALTER TABLE circles 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS who_can_invite TEXT DEFAULT 'all' CHECK (who_can_invite IN ('admin', 'all')),
ADD COLUMN IF NOT EXISTS who_can_create_events TEXT DEFAULT 'all' CHECK (who_can_create_events IN ('admin', 'all'));

-- Update existing circles to have default settings
UPDATE circles
SET 
  is_private = COALESCE(is_private, false),
  who_can_invite = COALESCE(who_can_invite, 'all'),
  who_can_create_events = COALESCE(who_can_create_events, 'all')
WHERE is_private IS NULL OR who_can_invite IS NULL OR who_can_create_events IS NULL;

-- Create activity_logs table to track all user actions
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
  entity_type VARCHAR(50) NOT NULL, -- 'inventory', 'household', 'distribution'
  entity_id UUID,
  entity_name TEXT NOT NULL,
  performed_by VARCHAR(255) NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);

-- Enable Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this is for admin tracking)
CREATE POLICY "Allow all operations on activity_logs" ON activity_logs
  FOR ALL USING (true) WITH CHECK (true);

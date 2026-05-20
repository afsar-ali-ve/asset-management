CREATE TABLE IF NOT EXISTS asset_assignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  assigned_to_user_id UUID REFERENCES users(id),
  assigned_to_name VARCHAR(255) NOT NULL,
  assigned_to_email VARCHAR(255),
  assigned_to_department VARCHAR(255),
  assigned_by_user_id UUID REFERENCES users(id),
  assigned_by_name VARCHAR(255),
  assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assignment_time TIME NOT NULL DEFAULT CURRENT_TIME,
  action_type VARCHAR(100) NOT NULL DEFAULT 'Assigned',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_assignment_history_asset_id ON asset_assignment_history(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_assignment_history_created_at ON asset_assignment_history(created_at);

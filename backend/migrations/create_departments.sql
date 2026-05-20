CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO departments (name, description, status)
VALUES
  ('IT', 'Information Technology', 'Active'),
  ('HR', 'Human Resources', 'Active'),
  ('Finance', 'Finance department', 'Active'),
  ('Operations', 'Operations department', 'Active'),
  ('Admin', 'Administration department', 'Active')
ON CONFLICT (name) DO UPDATE
SET
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = CURRENT_TIMESTAMP;

ALTER TABLE users DROP COLUMN IF EXISTS department;

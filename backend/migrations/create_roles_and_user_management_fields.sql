CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (role_name, description)
VALUES
  ('Admin', 'Full administrative access to user and asset management.'),
  ('Manager', 'Management access for teams and operational workflows.'),
  ('Employee', 'Standard employee access to assigned workflows.'),
  ('Viewer', 'Read-only access to permitted areas.')
ON CONFLICT (role_name) DO UPDATE
SET
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'Active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_users_role'
      AND table_name = 'users'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT fk_users_role
      FOREIGN KEY (role_id)
      REFERENCES roles(id)
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_users_created_by'
      AND table_name = 'users'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT fk_users_created_by
      FOREIGN KEY (created_by)
      REFERENCES users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

UPDATE users
SET
  role_id = COALESCE(role_id, (SELECT id FROM roles WHERE role_name = 'Employee')),
  status = COALESCE(NULLIF(status, ''), 'Active'),
  is_active = COALESCE(is_active, TRUE),
  updated_at = CURRENT_TIMESTAMP
WHERE role_id IS NULL OR status IS NULL;

INSERT INTO users (full_name, email, password, role_id, status, is_active)
VALUES (
  'Admin User',
  'admin@virtualemployee.com',
  '$2b$12$1HPBgEKlDoSu/G0nlkR2duaNivdD2CUEbitoIdBv98i2k5PuJ9.l6',
  (SELECT id FROM roles WHERE role_name = 'Admin'),
  'Active',
  TRUE
)
ON CONFLICT (email) DO UPDATE
SET
  full_name = COALESCE(users.full_name, EXCLUDED.full_name),
  role_id = (SELECT id FROM roles WHERE role_name = 'Admin'),
  status = 'Active',
  is_active = TRUE,
  updated_at = CURRENT_TIMESTAMP;

UPDATE users
SET
  role_id = (SELECT id FROM roles WHERE role_name = 'Admin'),
  status = 'Active',
  is_active = TRUE,
  updated_at = CURRENT_TIMESTAMP
WHERE email = 'admin@virtualemployee.com';

CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

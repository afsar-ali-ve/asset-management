INSERT INTO users (full_name, email, password)
VALUES
  ('John Doe', 'john@example.com', '$2b$12$1HPBgEKlDoSu/G0nlkR2duaNivdD2CUEbitoIdBv98i2k5PuJ9.l6'),
  ('Jane Smith', 'jane@example.com', '$2b$12$1HPBgEKlDoSu/G0nlkR2duaNivdD2CUEbitoIdBv98i2k5PuJ9.l6'),
  ('Michael Brown', 'michael@example.com', '$2b$12$1HPBgEKlDoSu/G0nlkR2duaNivdD2CUEbitoIdBv98i2k5PuJ9.l6'),
  ('Sarah Wilson', 'sarah@example.com', '$2b$12$1HPBgEKlDoSu/G0nlkR2duaNivdD2CUEbitoIdBv98i2k5PuJ9.l6')
ON CONFLICT (email) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  updated_at = CURRENT_TIMESTAMP;

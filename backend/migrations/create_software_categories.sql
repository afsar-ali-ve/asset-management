CREATE TABLE IF NOT EXISTS software_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO software_categories (display_name, description, active)
VALUES
    ('Others', '', true),
    ('Accounting', '', true),
    ('Multimedia', '', true),
    ('Internet', '', true),
    ('Graphics', '', true),
    ('Game', '', true),
    ('Operating System', '', true),
    ('Development', '', true),
    ('Database', '', true)
ON CONFLICT (display_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS asset_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    requires_ownership BOOLEAN DEFAULT false,
    requires_scan BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO asset_states (name, description, requires_ownership, requires_scan, active)
VALUES
    ('In Store', '', false, true, true),
    ('Expired', '', false, false, true),
    ('Disposed', '', false, false, true),
    ('In Use', '', true, true, true),
    ('In Repair', '', false, true, true),
    ('To Be Returned', '', true, true, true),
    ('Asset State11', 'Asset State11', true, true, true)
ON CONFLICT (name) DO NOTHING;

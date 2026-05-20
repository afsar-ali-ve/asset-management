CREATE TABLE IF NOT EXISTS software_license_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_type VARCHAR(255) NOT NULL UNIQUE,
    manufacturer VARCHAR(255),
    track_by VARCHAR(100) NOT NULL,
    installation_allowed VARCHAR(100) NOT NULL,
    is_perpetual BOOLEAN DEFAULT false,
    is_free_license BOOLEAN DEFAULT false,
    license_option TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO software_license_types
    (license_type, manufacturer, track_by, installation_allowed, is_perpetual, is_free_license, license_option, active)
VALUES
    ('Free License', '', 'Workstation', 'Unlimited', true, true, 'Free license', true),
    ('Trial License', '', 'Workstation', 'Volume', false, false, 'Trial license', true),
    ('Named User License', '', 'User', 'Single', false, false, 'Named user license', true),
    ('Node Locked', '', 'Workstation', 'Single', false, false, 'Node locked license', true),
    ('Concurrent License', '', 'User', 'Single', false, false, 'Concurrent license', true),
    ('Client Access License', '', 'CAL', 'Single', false, false, 'Client access license', true),
    ('OEM', '', 'Workstation', 'OEM', false, false, 'OEM license', true),
    ('Enterprise Subscription', '', 'Workstation', 'Unlimited', false, false, 'Enterprise subscription', true),
    ('Enterprise (Perpetual)', '', 'Workstation', 'Unlimited', true, false, 'Enterprise perpetual', true),
    ('Volume', '', 'Workstation', 'Volume', false, false, 'Volume license', true),
    ('Subscription', '', 'User', 'Unlimited', false, false, 'Subscription license', true),
    ('Site License', '', 'Workstation', 'Unlimited', false, false, 'Site license', true)
ON CONFLICT (license_type) DO NOTHING;

CREATE TABLE IF NOT EXISTS asset_workstation_processors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    processor VARCHAR(255),
    serial_number VARCHAR(255),
    cpu_model VARCHAR(255),
    manufacturer VARCHAR(255),
    processor_count VARCHAR(255),
    processor_speed_ghz VARCHAR(255),
    cpu_status VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asset_workstation_hard_disks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    model VARCHAR(255),
    serial_number VARCHAR(255),
    free_space VARCHAR(255),
    manufacturer VARCHAR(255),
    capacity VARCHAR(255),
    drive_type VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asset_workstation_keyboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    keyboard_type VARCHAR(255),
    keyboard_serial_number VARCHAR(255),
    keyboard_manufacturer VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asset_workstation_monitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    monitor_type VARCHAR(255),
    resolution VARCHAR(255),
    serial_number VARCHAR(255),
    manufacturer VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS asset_workstation_motherboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    product VARCHAR(255),
    serial_number VARCHAR(255),
    installed_date DATE,
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    version VARCHAR(255),
    part_number VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_workstation_processors_asset_id ON asset_workstation_processors(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_workstation_hard_disks_asset_id ON asset_workstation_hard_disks(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_workstation_keyboards_asset_id ON asset_workstation_keyboards(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_workstation_monitors_asset_id ON asset_workstation_monitors(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_workstation_motherboards_asset_id ON asset_workstation_motherboards(asset_id);

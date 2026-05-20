CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    product_id UUID REFERENCES products(id),
    serial_number VARCHAR(255),
    asset_tag VARCHAR(255),
    vendor_id UUID REFERENCES vendors(id),
    barcode_qr_code VARCHAR(255),
    purchase_cost DECIMAL(12, 2),
    acquisition_date DATE,
    expiry_date DATE,
    warranty_expiry_date DATE,
    location VARCHAR(255),
    asset_state_id UUID REFERENCES asset_states(id),
    assigned_user VARCHAR(255),
    department VARCHAR(255),
    associated_to VARCHAR(255),
    site VARCHAR(255),
    state_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assets_product_id ON assets(product_id);
CREATE INDEX IF NOT EXISTS idx_assets_vendor_id ON assets(vendor_id);
CREATE INDEX IF NOT EXISTS idx_assets_asset_state_id ON assets(asset_state_id);

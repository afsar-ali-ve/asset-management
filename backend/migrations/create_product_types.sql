CREATE TABLE product_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name VARCHAR(255) NOT NULL,
    api_name VARCHAR(255) NOT NULL,
    display_plural_name VARCHAR(255) NOT NULL,
    api_plural_name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    parent_product_type UUID REFERENCES product_types(id),
    asset_type VARCHAR(255),
    asset_category_type VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
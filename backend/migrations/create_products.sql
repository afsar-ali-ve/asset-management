CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    product_type_id UUID REFERENCES product_types(id),
    manufacturer VARCHAR(255),
    part_no VARCHAR(255),
    cost DECIMAL(10, 2),
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index on product_type_id for faster lookups
CREATE INDEX idx_products_product_type_id ON products(product_type_id);

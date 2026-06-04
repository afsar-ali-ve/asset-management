export enum AssetStatus {
  Active = 'active',
  Inactive = 'inactive',
  Assigned = 'assigned',
  Retired = 'retired'
}

export interface Asset {
  id: string | number;
  name: string;
  product_id?: string | number | null;
  product?: string | null;
  serial_number?: string | null;
  asset_tag?: string | null;
  vendor_id?: string | number | null;
  vendor?: string | null;
  asset_state_id?: string | number | null;
  asset_state?: string | null;
  assigned_user?: string | null;
  department?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ProductType {
  id: string | number;
  name?: string;
  display_name: string;
  parent_product_type?: string | number | null;
}

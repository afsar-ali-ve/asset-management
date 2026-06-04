import type { ApiId } from './api';

export enum AssetStatus {
  Active = 'active',
  Inactive = 'inactive',
  Assigned = 'assigned',
  Retired = 'retired'
}

export interface ProductType {
  id: ApiId;
  name?: string;
  display_name: string;
  parent_product_type?: ApiId | null;
}

export interface Asset {
  id: ApiId;
  name: string;
  product_id?: ApiId | null;
  product?: string | null;
  product_type?: string | null;
  serial_number?: string | null;
  asset_tag?: string | null;
  vendor_id?: ApiId | null;
  vendor?: string | null;
  asset_state_id?: ApiId | null;
  asset_state?: string | null;
  assigned_user?: string | null;
  department?: string | null;
  [key: string]: unknown;
}

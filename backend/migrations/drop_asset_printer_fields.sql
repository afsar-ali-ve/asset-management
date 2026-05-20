ALTER TABLE assets
  DROP COLUMN IF EXISTS sys_name,
  DROP COLUMN IF EXISTS sys_description,
  DROP COLUMN IF EXISTS sys_location,
  DROP COLUMN IF EXISTS sys_uptime,
  DROP COLUMN IF EXISTS printer_serial_number,
  DROP COLUMN IF EXISTS memory_type,
  DROP COLUMN IF EXISTS capacity,
  DROP COLUMN IF EXISTS capacity_unit,
  DROP COLUMN IF EXISTS manufacturer_serial_number;

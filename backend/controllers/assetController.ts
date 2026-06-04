const pool = require('../config/db');

const assetSelect = `
  SELECT
    a.id,
    a.name,
    a.product_id,
    p.name AS product,
    p.product_type_id,
    pt.display_name AS product_type,
    a.serial_number,
    a.asset_tag,
    a.vendor_id,
    v.name AS vendor,
    a.barcode_qr_code,
    a.purchase_cost,
    a.acquisition_date,
    a.expiry_date,
    a.warranty_expiry_date,
    a.location,
    a.asset_state_id,
    ast.name AS asset_state,
    a.assigned_user,
    a.department,
    a.associated_to,
    a.site,
    a.state_comments,
    a.impact_details,
    a.asset_audited,
    a.impact,
    a.ci_manufacturer,
    a.monitoring_protocol,
    a.uplink_dependency,
    a.number_of_interfaces,
    a.ci_serial_number,
    a.service_tag,
    a.dns_name,
    a.ci_vendor,
    a.system_description,
    a.ci_type,
    COALESCE(a.network_adapters, '[]'::jsonb) AS network_adapters,
    CASE
      WHEN awd.id IS NULL THEN NULL
      ELSE to_jsonb(awd) - 'id' - 'asset_id'
    END AS workstation_details,
    COALESCE((
      SELECT jsonb_agg(to_jsonb(awp) - 'asset_id' ORDER BY awp.created_at, awp.id)
      FROM asset_workstation_processors awp
      WHERE awp.asset_id = a.id
    ), '[]'::jsonb) AS workstation_processors,
    COALESCE((
      SELECT jsonb_agg(to_jsonb(awhd) - 'asset_id' ORDER BY awhd.created_at, awhd.id)
      FROM asset_workstation_hard_disks awhd
      WHERE awhd.asset_id = a.id
    ), '[]'::jsonb) AS workstation_hard_disks,
    COALESCE((
      SELECT jsonb_agg(to_jsonb(awk) - 'asset_id' ORDER BY awk.created_at, awk.id)
      FROM asset_workstation_keyboards awk
      WHERE awk.asset_id = a.id
    ), '[]'::jsonb) AS workstation_keyboards,
    COALESCE((
      SELECT jsonb_agg(to_jsonb(awm) - 'asset_id' ORDER BY awm.created_at, awm.id)
      FROM asset_workstation_monitors awm
      WHERE awm.asset_id = a.id
    ), '[]'::jsonb) AS workstation_monitors,
    COALESCE((
      SELECT jsonb_agg(to_jsonb(awmb) - 'asset_id' ORDER BY awmb.created_at, awmb.id)
      FROM asset_workstation_motherboards awmb
      WHERE awmb.asset_id = a.id
    ), '[]'::jsonb) AS workstation_motherboards,
    a.created_at,
    a.updated_at
  FROM assets a
  LEFT JOIN products p ON a.product_id = p.id
  LEFT JOIN product_types pt ON p.product_type_id = pt.id
  LEFT JOIN vendors v ON a.vendor_id = v.id
  LEFT JOIN asset_states ast ON a.asset_state_id = ast.id
  LEFT JOIN asset_workstation_details awd ON awd.asset_id = a.id
`;

const normalizeEmpty = (value) => (value === '' || value === undefined ? null : value);

const normalizeProductTypeName = (value) => (value || '').toString().toLowerCase().replace(/[\s_-]+/g, '');

const workstationDetailFields = [
  'monitoring_protocol',
  'service_tag',
  'last_logged_in_user',
  'bios_date',
  'smbios_version',
  'virtual_memory',
  'virtual_memory_unit',
  'logical_processors',
  'bios_name',
  'bios_version',
  'bios_manufacturer',
  'total_memory',
  'total_memory_unit',
  'domain',
  'total_slots',
  'operating_system',
  'service_pack',
  'build_number',
  'license_type',
  'system_drive',
  'os_version',
  'product_id',
  'system_type',
  'license_status',
  'vm_platform',
  'allowed_vms',
  'installed_vms',
];

const isWorkstationProduct = async (client, productId) => {
  if (!productId) {
    return false;
  }
  const result = await client.query(
    `SELECT pt.display_name
     FROM products p
     LEFT JOIN product_types pt ON p.product_type_id = pt.id
     WHERE p.id = $1`,
    [productId]
  );
  const productTypeName = result.rows[0]?.display_name;
  return ['workstation', 'workstations'].includes(normalizeProductTypeName(productTypeName));
};

const upsertWorkstationDetails = async (client, assetId, details = {}) => {
  const values = workstationDetailFields.map((field) => normalizeEmpty(details[field]));
  const insertColumns = ['asset_id', ...workstationDetailFields];
  const placeholders = insertColumns.map((_, index) => `$${index + 1}`);
  const updateSet = workstationDetailFields.map((field) => `${field} = EXCLUDED.${field}`).join(',\n         ');

  await client.query(
    `INSERT INTO asset_workstation_details (${insertColumns.join(', ')})
     VALUES (${placeholders.join(', ')})
     ON CONFLICT (asset_id) DO UPDATE SET
       ${updateSet},
       updated_at = CURRENT_TIMESTAMP`,
    [assetId, ...values]
  );
};

const workstationCollectionConfigs = {
  workstation_processors: {
    table: 'asset_workstation_processors',
    fields: ['processor', 'serial_number', 'cpu_model', 'manufacturer', 'processor_count', 'processor_speed_ghz', 'cpu_status'],
  },
  workstation_hard_disks: {
    table: 'asset_workstation_hard_disks',
    fields: ['model', 'serial_number', 'free_space', 'manufacturer', 'capacity', 'drive_type'],
  },
  workstation_keyboards: {
    table: 'asset_workstation_keyboards',
    fields: ['keyboard_type', 'keyboard_serial_number', 'keyboard_manufacturer'],
  },
  workstation_monitors: {
    table: 'asset_workstation_monitors',
    fields: ['monitor_type', 'resolution', 'serial_number', 'manufacturer'],
  },
  workstation_motherboards: {
    table: 'asset_workstation_motherboards',
    fields: ['product', 'serial_number', 'installed_date', 'manufacturer', 'model', 'version', 'part_number'],
  },
};

const replaceWorkstationCollection = async (client, assetId, config, rows = []) => {
  await client.query(`DELETE FROM ${config.table} WHERE asset_id = $1`, [assetId]);
  const cleanRows = Array.isArray(rows) ? rows : [];

  for (const row of cleanRows) {
    const hasValue = config.fields.some((field) => normalizeEmpty(row?.[field]) !== null);
    if (!hasValue) {
      continue;
    }
    const columns = ['asset_id', ...config.fields];
    const placeholders = columns.map((_, index) => `$${index + 1}`);
    const values = [assetId, ...config.fields.map((field) => normalizeEmpty(row?.[field]))];
    await client.query(
      `INSERT INTO ${config.table} (${columns.join(', ')})
       VALUES (${placeholders.join(', ')})`,
      values
    );
  }
};

const replaceWorkstationCollections = async (client, assetId, body) => {
  for (const [bodyKey, config] of Object.entries(workstationCollectionConfigs)) {
    await replaceWorkstationCollection(client, assetId, config, body[bodyKey]);
  }
};

const deleteWorkstationCollections = async (client, assetId) => {
  await client.query('DELETE FROM asset_workstation_details WHERE asset_id = $1', [assetId]);
  for (const config of Object.values(workstationCollectionConfigs)) {
    await client.query(`DELETE FROM ${config.table} WHERE asset_id = $1`, [assetId]);
  }
};

const normalizeJsonArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === '' || value === undefined || value === null) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const getAssignmentHistoryRows = async (assetId) => {
  const result = await pool.query(
    `SELECT
       id,
       asset_id,
       assigned_to_user_id,
       assigned_to_name,
       assigned_to_email,
       assigned_to_department,
       assigned_by_user_id,
       assigned_by_name,
       assignment_date,
       assignment_time,
       action_type,
       description,
       created_at,
       updated_at
     FROM asset_assignment_history
     WHERE asset_id = $1
     ORDER BY created_at DESC, assignment_date DESC, assignment_time DESC`,
    [assetId]
  );
  return result.rows;
};

const getAllAssets = async (req, res) => {
  try {
    const { product_type_id } = req.query;
    const values = [];
    let whereClause = '';

    if (product_type_id) {
      values.push(product_type_id);
      whereClause = `
        WHERE p.product_type_id IN (
          WITH RECURSIVE product_type_tree AS (
            SELECT id FROM product_types WHERE id = $1
            UNION ALL
            SELECT child.id
            FROM product_types child
            INNER JOIN product_type_tree parent ON child.parent_product_type = parent.id
          )
          SELECT id FROM product_type_tree
        )
      `;
    }

    const result = await pool.query(`${assetSelect} ${whereClause} ORDER BY a.created_at DESC`, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching assets:', err);
    res.status(500).json({ error: err.message });
  }
};

const getAssetById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`${assetSelect} WHERE a.id = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching asset:', err);
    res.status(500).json({ error: err.message });
  }
};

const createAsset = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      name,
      product_id,
      serial_number,
      asset_tag,
      vendor_id,
      barcode_qr_code,
      purchase_cost,
      acquisition_date,
      expiry_date,
      warranty_expiry_date,
      location,
      asset_state_id,
      assigned_user,
      department,
      associated_to,
      site,
      state_comments,
      impact_details,
      asset_audited,
      impact,
      ci_manufacturer,
      monitoring_protocol,
      uplink_dependency,
      number_of_interfaces,
      ci_serial_number,
      service_tag,
      dns_name,
      ci_vendor,
      system_description,
      ci_type,
      network_adapters,
      workstation_details,
      workstation_processors,
      workstation_hard_disks,
      workstation_keyboards,
      workstation_monitors,
      workstation_motherboards,
    } = req.body;

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO assets (
        name, product_id, serial_number, asset_tag, vendor_id, barcode_qr_code,
        purchase_cost, acquisition_date, expiry_date, warranty_expiry_date, location,
        asset_state_id, assigned_user, department, associated_to, site, state_comments,
        impact_details, asset_audited, impact, ci_manufacturer, monitoring_protocol,
        uplink_dependency, number_of_interfaces, ci_serial_number, service_tag,
        dns_name, ci_vendor, system_description, ci_type, network_adapters
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31::jsonb
      )
      RETURNING *`,
      [
        name,
        normalizeEmpty(product_id),
        normalizeEmpty(serial_number),
        normalizeEmpty(asset_tag),
        normalizeEmpty(vendor_id),
        normalizeEmpty(barcode_qr_code),
        normalizeEmpty(purchase_cost),
        normalizeEmpty(acquisition_date),
        normalizeEmpty(expiry_date),
        normalizeEmpty(warranty_expiry_date),
        normalizeEmpty(location),
        normalizeEmpty(asset_state_id),
        normalizeEmpty(assigned_user),
        normalizeEmpty(department),
        normalizeEmpty(associated_to),
        normalizeEmpty(site),
        normalizeEmpty(state_comments),
        normalizeEmpty(impact_details),
        normalizeEmpty(asset_audited),
        normalizeEmpty(impact),
        normalizeEmpty(ci_manufacturer),
        normalizeEmpty(monitoring_protocol),
        normalizeEmpty(uplink_dependency),
        normalizeEmpty(number_of_interfaces),
        normalizeEmpty(ci_serial_number),
        normalizeEmpty(service_tag),
        normalizeEmpty(dns_name),
        normalizeEmpty(ci_vendor),
        normalizeEmpty(system_description),
        normalizeEmpty(ci_type),
        JSON.stringify(normalizeJsonArray(network_adapters)),
      ]
    );

    const assetId = result.rows[0].id;
    if (await isWorkstationProduct(client, normalizeEmpty(product_id))) {
      await upsertWorkstationDetails(client, assetId, workstation_details || {});
      await replaceWorkstationCollections(client, assetId, {
        workstation_processors,
        workstation_hard_disks,
        workstation_keyboards,
        workstation_monitors,
        workstation_motherboards,
      });
    }

    const created = await client.query(`${assetSelect} WHERE a.id = $1`, [assetId]);
    await client.query('COMMIT');
    res.status(201).json(created.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating asset:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

const updateAsset = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const {
      name,
      product_id,
      serial_number,
      asset_tag,
      vendor_id,
      barcode_qr_code,
      purchase_cost,
      acquisition_date,
      expiry_date,
      warranty_expiry_date,
      location,
      asset_state_id,
      assigned_user,
      department,
      associated_to,
      site,
      state_comments,
      impact_details,
      asset_audited,
      impact,
      ci_manufacturer,
      monitoring_protocol,
      uplink_dependency,
      number_of_interfaces,
      ci_serial_number,
      service_tag,
      dns_name,
      ci_vendor,
      system_description,
      ci_type,
      network_adapters,
      workstation_details,
      workstation_processors,
      workstation_hard_disks,
      workstation_keyboards,
      workstation_monitors,
      workstation_motherboards,
    } = req.body;

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE assets SET
        name = $1,
        product_id = $2,
        serial_number = $3,
        asset_tag = $4,
        vendor_id = $5,
        barcode_qr_code = $6,
        purchase_cost = $7,
        acquisition_date = $8,
        expiry_date = $9,
        warranty_expiry_date = $10,
        location = $11,
        asset_state_id = $12,
        assigned_user = $13,
        department = $14,
        associated_to = $15,
        site = $16,
        state_comments = $17,
        impact_details = $18,
        asset_audited = $19,
        impact = $20,
        ci_manufacturer = $21,
        monitoring_protocol = $22,
        uplink_dependency = $23,
        number_of_interfaces = $24,
        ci_serial_number = $25,
        service_tag = $26,
        dns_name = $27,
        ci_vendor = $28,
        system_description = $29,
        ci_type = $30,
        network_adapters = $31::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $32
      RETURNING id`,
      [
        name,
        normalizeEmpty(product_id),
        normalizeEmpty(serial_number),
        normalizeEmpty(asset_tag),
        normalizeEmpty(vendor_id),
        normalizeEmpty(barcode_qr_code),
        normalizeEmpty(purchase_cost),
        normalizeEmpty(acquisition_date),
        normalizeEmpty(expiry_date),
        normalizeEmpty(warranty_expiry_date),
        normalizeEmpty(location),
        normalizeEmpty(asset_state_id),
        normalizeEmpty(assigned_user),
        normalizeEmpty(department),
        normalizeEmpty(associated_to),
        normalizeEmpty(site),
        normalizeEmpty(state_comments),
        normalizeEmpty(impact_details),
        normalizeEmpty(asset_audited),
        normalizeEmpty(impact),
        normalizeEmpty(ci_manufacturer),
        normalizeEmpty(monitoring_protocol),
        normalizeEmpty(uplink_dependency),
        normalizeEmpty(number_of_interfaces),
        normalizeEmpty(ci_serial_number),
        normalizeEmpty(service_tag),
        normalizeEmpty(dns_name),
        normalizeEmpty(ci_vendor),
        normalizeEmpty(system_description),
        normalizeEmpty(ci_type),
        JSON.stringify(normalizeJsonArray(network_adapters)),
        id,
      ]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (await isWorkstationProduct(client, normalizeEmpty(product_id))) {
      await upsertWorkstationDetails(client, id, workstation_details || {});
      await replaceWorkstationCollections(client, id, {
        workstation_processors,
        workstation_hard_disks,
        workstation_keyboards,
        workstation_monitors,
        workstation_motherboards,
      });
    } else {
      await deleteWorkstationCollections(client, id);
    }

    const updated = await client.query(`${assetSelect} WHERE a.id = $1`, [id]);
    await client.query('COMMIT');
    res.json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating asset:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

const assignAsset = async (req, res) => {
  const client = await pool.connect();
  try {
    const { assetId } = req.params;
    const assignedToUserId = req.body.assigned_to_user_id || req.body.user_id || req.body.userId;
    const departmentId = req.body.department_id || req.body.departmentId;

    if (!assignedToUserId) {
      return res.status(400).json({ error: 'Assigned user is required' });
    }
    if (!departmentId) {
      return res.status(400).json({ error: 'Department is required' });
    }
    if (assignedToUserId === req.user.id) {
      return res.status(400).json({ error: 'You cannot assign an asset to yourself' });
    }

    await client.query('BEGIN');

    const assetResult = await client.query('SELECT id, assigned_user, department FROM assets WHERE id = $1 FOR UPDATE', [assetId]);
    if (assetResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Asset not found' });
    }

    const assigneeResult = await client.query(
      'SELECT id, full_name, email FROM users WHERE id = $1',
      [assignedToUserId]
    );
    if (assigneeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Assigned user not found' });
    }

    const departmentResult = await client.query(
      `SELECT id, name
       FROM departments
       WHERE id = $1 AND LOWER(status) = 'active'`,
      [departmentId]
    );
    if (departmentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Department not found' });
    }

    const assignedByResult = await client.query(
      'SELECT id, full_name, email FROM users WHERE id = $1',
      [req.user.id]
    );
    const assignee = assigneeResult.rows[0];
    const department = departmentResult.rows[0];
    const assignedBy = assignedByResult.rows[0] || { id: req.user.id, full_name: req.user.email || 'Unknown User' };
    const previousAssignment = assetResult.rows[0];
    const actionType = previousAssignment.assigned_user ? 'Reassigned' : 'Assigned';
    const description = previousAssignment.assigned_user
      ? `Asset reassigned from ${previousAssignment.assigned_user} to ${assignee.full_name}.`
      : `Asset assigned to ${assignee.full_name}.`;

    await client.query(
      `UPDATE assets
       SET assigned_user = $1, department = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [assignee.full_name, department.name, assetId]
    );

    await client.query(
      `INSERT INTO asset_assignment_history (
         asset_id,
         assigned_to_user_id,
         assigned_to_name,
         assigned_to_email,
         assigned_to_department,
         assigned_by_user_id,
         assigned_by_name,
         assignment_date,
         assignment_time,
         action_type,
         description
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, CURRENT_TIME, $8, $9)`,
      [
        assetId,
        assignee.id,
        assignee.full_name,
        assignee.email,
        department.name,
        assignedBy.id,
        assignedBy.full_name,
        actionType,
        description,
      ]
    );

    const updatedAsset = await client.query(`${assetSelect} WHERE a.id = $1`, [assetId]);
    const history = await client.query(
      `SELECT
         id,
         asset_id,
         assigned_to_user_id,
         assigned_to_name,
         assigned_to_email,
         assigned_to_department,
         assigned_by_user_id,
         assigned_by_name,
         assignment_date,
         assignment_time,
         action_type,
         description,
         created_at,
         updated_at
       FROM asset_assignment_history
       WHERE asset_id = $1
       ORDER BY created_at DESC, assignment_date DESC, assignment_time DESC`,
      [assetId]
    );

    await client.query('COMMIT');
    res.json({ asset: updatedAsset.rows[0], history: history.rows });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error assigning asset:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

const getAssignmentHistory = async (req, res) => {
  try {
    const { assetId } = req.params;
    const assetResult = await pool.query('SELECT id FROM assets WHERE id = $1', [assetId]);
    if (assetResult.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const history = await getAssignmentHistoryRows(assetId);
    res.json({ history });
  } catch (err) {
    console.error('Error fetching assignment history:', err);
    res.status(500).json({ error: err.message });
  }
};

const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM assets WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ message: 'Asset deleted successfully' });
  } catch (err) {
    console.error('Error deleting asset:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  assignAsset,
  getAssignmentHistory,
  deleteAsset,
};

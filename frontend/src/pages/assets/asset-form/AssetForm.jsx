import React, { useEffect, useState } from 'react';
import { createAsset, updateAsset } from '../../../services/api';
const emptyAssetInput = {
    name: '',
    product_id: '',
    serial_number: '',
    asset_tag: '',
    vendor_id: '',
    barcode_qr_code: '',
    purchase_cost: '',
    acquisition_date: '',
    expiry_date: '',
    warranty_expiry_date: '',
    location: '',
    asset_state_id: '',
    assigned_user: '',
    department: '',
    associated_to: '',
    site: '',
    state_comments: '',
    impact_details: '',
    asset_audited: '',
    impact: '',
    ci_manufacturer: '',
    monitoring_protocol: '',
    uplink_dependency: '',
    number_of_interfaces: '',
    ci_serial_number: '',
    service_tag: '',
    dns_name: '',
    ci_vendor: '',
    system_description: '',
    ci_type: '',
    network_adapters: [],
};
const emptyWorkstationDetails = {
    monitoring_protocol: '',
    service_tag: '',
    last_logged_in_user: '',
    bios_date: '',
    smbios_version: '',
    virtual_memory: '',
    virtual_memory_unit: 'GB',
    logical_processors: '',
    bios_name: '',
    bios_version: '',
    bios_manufacturer: '',
    total_memory: '',
    total_memory_unit: 'GB',
    domain: '',
    total_slots: '',
    operating_system: '',
    service_pack: '',
    build_number: '',
    license_type: '',
    system_drive: '',
    os_version: '',
    product_id: '',
    system_type: '',
    license_status: '',
    vm_platform: '',
    allowed_vms: '',
    installed_vms: '',
};
const normalizeProductTypeName = (value) => (value || '').toString().toLowerCase().replace(/[\s_-]+/g, '');
const formatDateValue = (value) => {
    if (!value) {
        return '';
    }
    return value.slice(0, 10);
};
const Field = ({ label, name, required = false, children, errors = {} }) => (<div className="grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-start">
    <label htmlFor={name} className="pt-2 text-right text-sm font-medium text-slate-700 sm:pr-3">
      {required && <span className="mr-1 text-red-500">*</span>}
      {label}
    </label>
    <div>
      {children}
      {errors[name] && <p className="mt-1 text-xs font-medium text-red-600">{errors[name]}</p>}
    </div>
  </div>);
const Section = ({ title, children, info = false }) => (<section className="border-t border-slate-200 pt-5 first:border-t-0 first:pt-0">
    <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-slate-900">
      {title}
      {info && <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">i</span>}
    </h2>
    <div className="grid grid-cols-1 gap-x-16 gap-y-4 xl:grid-cols-2">{children}</div>
  </section>);
const UnitField = ({ label, name, unitName, workstationDetails, onChange, readonly, inputClassName }) => (<Field label={label} name={name}>
    <div className="flex">
      <input id={name} name={name} value={workstationDetails[name] || ''} onChange={onChange} disabled={readonly} className={`${inputClassName} rounded-r-none`}/>
      <select aria-label={`${label} unit`} name={unitName} value={workstationDetails[unitName] || 'GB'} onChange={onChange} disabled={readonly} className="h-9 rounded-r-md border border-l-0 border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400">
        <option value="GB">GB</option>
        <option value="MB">MB</option>
        <option value="TB">TB</option>
      </select>
    </div>
  </Field>);
const createHardwareRowId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const workstationHardwareConfigs = [
    {
        key: 'workstation_processors',
        title: 'Processors',
        maxRecords: 200,
        minWidth: 1120,
        fields: [
            ['processor', 'PROCESSOR'],
            ['serial_number', 'SERIAL NUMBER'],
            ['cpu_model', 'CPU MODEL'],
            ['manufacturer', 'MANUFACTURER'],
            ['processor_count', 'PROCESSOR COUNT'],
            ['processor_speed_ghz', 'PROCESSOR SPEED (GHZ)'],
            ['cpu_status', 'CPU STATUS'],
        ],
    },
    {
        key: 'workstation_hard_disks',
        title: 'Hard Disks',
        maxRecords: 250,
        minWidth: 980,
        fields: [
            ['model', 'MODEL'],
            ['serial_number', 'SERIAL NUMBER'],
            ['free_space', 'FREE SPACE'],
            ['manufacturer', 'MANUFACTURER'],
            ['capacity', 'CAPACITY'],
            ['drive_type', 'DRIVE TYPE'],
        ],
    },
    {
        key: 'workstation_keyboards',
        title: 'Keyboards',
        maxRecords: 100,
        minWidth: 760,
        fields: [
            ['keyboard_type', 'KEYBOARD TYPE'],
            ['keyboard_serial_number', 'KEYBOARD SERIAL NUMBER'],
            ['keyboard_manufacturer', 'KEYBOARD MANUFACTURER'],
        ],
    },
    {
        key: 'workstation_monitors',
        title: 'Monitors',
        maxRecords: 100,
        minWidth: 860,
        fields: [
            ['monitor_type', 'MONITOR TYPE'],
            ['resolution', 'RESOLUTION'],
            ['serial_number', 'SERIAL NUMBER'],
            ['manufacturer', 'MANUFACTURER'],
        ],
    },
    {
        key: 'workstation_motherboards',
        title: 'Motherboards',
        maxRecords: 100,
        minWidth: 1120,
        requiredFirstColumn: true,
        fields: [
            ['product', 'PRODUCT'],
            ['serial_number', 'SERIAL NUMBER'],
            ['installed_date', 'INSTALLED DATE', 'date'],
            ['manufacturer', 'MANUFACTURER'],
            ['model', 'MODEL'],
            ['version', 'VERSION'],
            ['part_number', 'PART NUMBER'],
        ],
    },
];
const WorkstationHardwareTable = ({ config, rows, readonly, onAdd, onChange, onRemove }) => (<section className="border-t border-slate-200 pt-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-slate-900">{config.title}</h2>
      <span className="text-sm text-slate-500">Maximum records allowed : {config.maxRecords}</span>
    </div>
    <div className="overflow-x-auto border border-slate-200 bg-white">
      <table className="w-full border-collapse text-left text-sm" style={{ minWidth: `${config.minWidth}px` }}>
        <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-700">
          <tr>
            {config.fields.map(([field, label], index) => (
              <th key={field} className="border-b border-r border-slate-200 px-3 py-2 last:border-r-0">
                {config.requiredFirstColumn && index === 0 && <span className="mr-1 text-red-500">*</span>}
                {label}
              </th>
            ))}
            {!readonly && <th className="w-20 border-b border-slate-200 px-3 py-2">Action</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={readonly ? config.fields.length : config.fields.length + 1} className="px-3 py-4 text-slate-500">
                <span className="mr-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-white">i</span>
                No data available
                {!readonly && (
                  <button type="button" onClick={() => onAdd(config.key)} className="ml-3 text-sm font-medium text-blue-600 hover:text-blue-700">
                    Add New
                  </button>
                )}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row._rowId} className="border-b border-slate-200 last:border-b-0">
                {config.fields.map(([field, , type]) => (
                  <td key={field} className="border-r border-slate-200 px-2 py-2 last:border-r-0">
                    <input
                      type={type || 'text'}
                      value={row[field] || ''}
                      onChange={(event) => onChange(config.key, row._rowId, field, event.target.value)}
                      disabled={readonly}
                      className="h-8 w-full rounded border border-slate-300 px-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </td>
                ))}
                {!readonly && (
                  <td className="px-2 py-2">
                    <button type="button" onClick={() => onRemove(config.key, row._rowId)} className="text-sm font-medium text-red-600 hover:text-red-700">
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    {!readonly && rows.length > 0 && rows.length < config.maxRecords && (
      <button type="button" onClick={() => onAdd(config.key)} className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700">
        Add New
      </button>
    )}
  </section>);
const createEmptyHardwareState = () => workstationHardwareConfigs.reduce((state, config) => ({
    ...state,
    [config.key]: [],
}), {});
const normalizeHardwareRows = (rows = []) => (Array.isArray(rows)
    ? rows.map((row) => ({
        ...row,
        installed_date: formatDateValue(row.installed_date),
        _rowId: row.id || createHardwareRowId(),
    }))
    : []);
const stripHardwareRows = (rows = []) => rows.map(({ _rowId, id, created_at, updated_at, ...row }) => row);
const AssetForm = ({ editing, mode, products, productTypes, vendors, assetStates, selectedProductTypeId, saving, onBack, onSave, }) => {
    const [formData, setFormData] = useState(emptyAssetInput);
    const [workstationDetails, setWorkstationDetails] = useState(emptyWorkstationDetails);
    const [workstationHardware, setWorkstationHardware] = useState(createEmptyHardwareState);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const readonly = mode === 'view';
    useEffect(() => {
        if (editing) {
            setFormData({
                name: editing.name || '',
                product_id: editing.product_id || '',
                serial_number: editing.serial_number || '',
                asset_tag: editing.asset_tag || '',
                vendor_id: editing.vendor_id || '',
                barcode_qr_code: editing.barcode_qr_code || '',
                purchase_cost: editing.purchase_cost || '',
                acquisition_date: formatDateValue(editing.acquisition_date),
                expiry_date: formatDateValue(editing.expiry_date),
                warranty_expiry_date: formatDateValue(editing.warranty_expiry_date),
                location: editing.location || '',
                asset_state_id: editing.asset_state_id || '',
                assigned_user: editing.assigned_user || '',
                department: editing.department || '',
                associated_to: editing.associated_to || '',
                site: editing.site || '',
                state_comments: editing.state_comments || '',
                impact_details: editing.impact_details || '',
                asset_audited: editing.asset_audited || '',
                impact: editing.impact || '',
                ci_manufacturer: editing.ci_manufacturer || '',
                monitoring_protocol: editing.monitoring_protocol || '',
                uplink_dependency: editing.uplink_dependency || '',
                number_of_interfaces: editing.number_of_interfaces || '',
                ci_serial_number: editing.ci_serial_number || '',
                service_tag: editing.service_tag || '',
                dns_name: editing.dns_name || '',
                ci_vendor: editing.ci_vendor || '',
                system_description: editing.system_description || '',
                ci_type: editing.ci_type || '',
                network_adapters: Array.isArray(editing.network_adapters) ? editing.network_adapters : [],
            });
            setWorkstationDetails({
                ...emptyWorkstationDetails,
                ...(editing.workstation_details || {}),
                bios_date: formatDateValue(editing.workstation_details?.bios_date),
                virtual_memory_unit: editing.workstation_details?.virtual_memory_unit || 'GB',
                total_memory_unit: editing.workstation_details?.total_memory_unit || 'GB',
            });
            setWorkstationHardware(workstationHardwareConfigs.reduce((state, config) => ({
                ...state,
                [config.key]: normalizeHardwareRows(editing[config.key]),
            }), {}));
        }
        else {
            setFormData(emptyAssetInput);
            setWorkstationDetails(emptyWorkstationDetails);
            setWorkstationHardware(createEmptyHardwareState());
        }
    }, [editing]);
    const selectedProductTypeIds = new Set();
    if (selectedProductTypeId) {
        const stack = [selectedProductTypeId];
        while (stack.length > 0) {
            const id = stack.pop();
            if (!id || selectedProductTypeIds.has(id)) {
                continue;
            }
            selectedProductTypeIds.add(id);
            productTypes
                .filter((productType) => productType.parent_product_type === id)
                .forEach((productType) => stack.push(productType.id));
        }
    }
    const availableProducts = selectedProductTypeId
        ? products.filter((product) => selectedProductTypeIds.has(product.product_type_id || '') || product.id === formData.product_id)
        : products;
    const selectedProductType = productTypes.find((productType) => productType.id === selectedProductTypeId);
    const selectedProduct = products.find((product) => product.id === formData.product_id);
    const selectedFormProductType = productTypes.find((productType) => productType.id === selectedProduct?.product_type_id);
    const formProductTypeName = editing?.product_type || selectedProductType?.display_name || selectedProductType?.name || 'Asset';
    const activeProductTypeName = selectedFormProductType?.display_name || editing?.product_type || selectedProductType?.display_name || selectedProductType?.name || '';
    const showWorkstationDetails = ['workstation', 'workstations'].includes(normalizeProductTypeName(activeProductTypeName));
    const pageTitle = editing
        ? `${readonly ? 'View' : 'Edit'} ${formProductTypeName}`
        : `Add New ${formProductTypeName}`;
    const handleChange = (event) => {
        setFormData((currentData) => ({ ...currentData, [event.target.name]: event.target.value }));
        setErrors((currentErrors) => {
            if (!currentErrors[event.target.name]) {
                return currentErrors;
            }
            const nextErrors = { ...currentErrors };
            delete nextErrors[event.target.name];
            return nextErrors;
        });
    };
    const handleNetworkAdapterChange = (index, field, value) => {
        setFormData((currentData) => {
            const adapters = Array.isArray(currentData.network_adapters) ? [...currentData.network_adapters] : [];
            adapters[index] = { ...adapters[index], [field]: value };
            return { ...currentData, network_adapters: adapters };
        });
    };
    const handleAddNetworkAdapter = () => {
        if (readonly) {
            return;
        }
        setFormData((currentData) => ({
            ...currentData,
            network_adapters: [
                ...(Array.isArray(currentData.network_adapters) ? currentData.network_adapters : []),
                {
                    ip_address: '',
                    mac_address: '',
                    nic_name: '',
                    nic_lease: '',
                    gateway: '',
                    network: '',
                    nic_description: '',
                },
            ],
        }));
    };
    const handleWorkstationChange = (event) => {
        setWorkstationDetails((currentDetails) => ({ ...currentDetails, [event.target.name]: event.target.value }));
    };
    const handleAddWorkstationHardwareRow = (sectionKey) => {
        if (readonly) {
            return;
        }
        const config = workstationHardwareConfigs.find((currentConfig) => currentConfig.key === sectionKey);
        if (!config) {
            return;
        }
        setWorkstationHardware((currentHardware) => {
            const currentRows = currentHardware[sectionKey] || [];
            if (currentRows.length >= config.maxRecords) {
                return currentHardware;
            }
            const emptyRow = config.fields.reduce((row, [field]) => ({ ...row, [field]: '' }), { _rowId: createHardwareRowId() });
            return { ...currentHardware, [sectionKey]: [...currentRows, emptyRow] };
        });
    };
    const handleWorkstationHardwareChange = (sectionKey, rowId, field, value) => {
        setWorkstationHardware((currentHardware) => ({
            ...currentHardware,
            [sectionKey]: (currentHardware[sectionKey] || []).map((row) => (row._rowId === rowId ? { ...row, [field]: value } : row)),
        }));
    };
    const handleRemoveWorkstationHardwareRow = (sectionKey, rowId) => {
        if (readonly) {
            return;
        }
        setWorkstationHardware((currentHardware) => ({
            ...currentHardware,
            [sectionKey]: (currentHardware[sectionKey] || []).filter((row) => row._rowId !== rowId),
        }));
    };
    const handleRemoveNetworkAdapter = (index) => {
        if (readonly) {
            return;
        }
        setFormData((currentData) => ({
            ...currentData,
            network_adapters: (Array.isArray(currentData.network_adapters) ? currentData.network_adapters : []).filter((_, adapterIndex) => adapterIndex !== index),
        }));
    };
    const validateForm = () => {
        const nextErrors = {};
        if (!formData.name.trim()) {
            nextErrors.name = 'Asset name is required.';
        }
        if (!formData.product_id) {
            nextErrors.product_id = 'Product is required.';
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };
    const handleSave = async (continueEditing = false) => {
        if (saving || submitting || readonly) {
            return;
        }
        if (!validateForm()) {
            return;
        }
        setSubmitting(true);
        try {
            const payload = showWorkstationDetails
                ? {
                    ...formData,
                    workstation_details: workstationDetails,
                    ...workstationHardwareConfigs.reduce((payloadCollections, config) => ({
                        ...payloadCollections,
                        [config.key]: stripHardwareRows(workstationHardware[config.key] || []),
                    }), {}),
                }
                : formData;
            if (editing) {
                await updateAsset(editing.id, payload);
            }
            else {
                await createAsset(payload);
            }
            onSave();
            if (!continueEditing) {
                onBack();
            }
        }
        catch (error) {
            console.error('Error saving asset:', error);
        }
        finally {
            setSubmitting(false);
        }
    };
    const isSubmitting = saving || submitting;
    const inputClassName = 'h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400';
    const textareaClassName = 'min-h-20 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-400';
    const networkAdapters = Array.isArray(formData.network_adapters) ? formData.network_adapters : [];
    const networkAdapterFields = [
        ['ip_address', 'IP ADDRESS'],
        ['mac_address', 'MAC ADDRESS'],
        ['nic_name', 'NIC NAME'],
        ['nic_lease', 'NIC LEASE'],
        ['gateway', 'GATEWAY'],
        ['network', 'NETWORK'],
        ['nic_description', 'NIC DESCRIPTION'],
    ];
    return (<div className="min-h-[calc(100vh-8rem)] bg-white">
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Back to asset list">
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{pageTitle}</h1>
             </div>
        </div>
      </div>

      <form className="pb-24" onSubmit={(event) => {
            event.preventDefault();
            handleSave(false);
        }}>
        <div className="max-w-7xl space-y-7 px-4 py-6 sm:px-6">
          <Section title="Asset Details">
            <Field label="Asset Name" name="name" required errors={errors}>
              <input id="name" name="name" value={formData.name} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
            <Field label="Product" name="product_id" required errors={errors}>
              <select id="product_id" name="product_id" value={formData.product_id} onChange={handleChange} disabled={readonly} className={inputClassName}>
                <option value="">--Select--</option>
                {availableProducts.map((product) => (<option key={product.id} value={product.id}>{product.name}</option>))}
              </select>
            </Field>
            <Field label="Asset Tag" name="asset_tag">
              <input id="asset_tag" name="asset_tag" value={formData.asset_tag} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
            <Field label="Vendor" name="vendor_id">
              <select id="vendor_id" name="vendor_id" value={formData.vendor_id} onChange={handleChange} disabled={readonly} className={inputClassName}>
                <option value="">--Select--</option>
                {vendors.map((vendor) => (<option key={vendor.id} value={String(vendor.id)}>{vendor.name}</option>))}
              </select>
            </Field>
            <Field label="Org Serial Number" name="serial_number">
              <input id="serial_number" name="serial_number" value={formData.serial_number} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
            <Field label="Barcode" name="barcode_qr_code">
              <input id="barcode_qr_code" name="barcode_qr_code" value={formData.barcode_qr_code} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
            <Field label="Description" name="state_comments">
              <textarea id="state_comments" name="state_comments" value={formData.state_comments} onChange={handleChange} disabled={readonly} className={textareaClassName}/>
            </Field>
          </Section>

          <Section title="Asset State and Location">
            <Field label="Asset State" name="asset_state_id">
              <select id="asset_state_id" name="asset_state_id" value={formData.asset_state_id} onChange={handleChange} disabled={readonly} className={inputClassName}>
                <option value="">--Select--</option>
                {assetStates.map((assetState) => (<option key={assetState.id} value={assetState.id}>{assetState.name}</option>))}
              </select>
            </Field>
            <Field label="User" name="assigned_user">
              <input id="assigned_user" name="assigned_user" value={formData.assigned_user} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
            <Field label="Department" name="department">
              <input id="department" name="department" value={formData.department} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
            <Field label="Associated to Assets" name="associated_to">
              <input id="associated_to" name="associated_to" value={formData.associated_to} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
            <Field label="Site" name="site">
              <input id="site" name="site" value={formData.site} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
            <Field label="Location" name="location">
              <input id="location" name="location" value={formData.location} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
          </Section>

          <Section title="Purchase Details">
            <Field label="Acquisition Date" name="acquisition_date">
              <input id="acquisition_date" type="date" name="acquisition_date" value={formData.acquisition_date} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
            <Field label="Purchase Cost" name="purchase_cost">
              <input id="purchase_cost" name="purchase_cost" value={formData.purchase_cost} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
            <Field label="Expiry Date" name="expiry_date">
              <input id="expiry_date" type="date" name="expiry_date" value={formData.expiry_date} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
            <Field label="Warranty Expiry Date" name="warranty_expiry_date">
              <input id="warranty_expiry_date" type="date" name="warranty_expiry_date" value={formData.warranty_expiry_date} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
          </Section>

          <Section title="Asset Additional Fields Section" info>
            <Field label="Impact details" name="impact_details">
              <textarea id="impact_details" name="impact_details" value={formData.impact_details} onChange={handleChange} disabled={readonly} className={textareaClassName}/>
            </Field>
            <Field label="Asset Audited" name="asset_audited">
              <select id="asset_audited" name="asset_audited" value={formData.asset_audited} onChange={handleChange} disabled={readonly} className={inputClassName}>
                <option value="">--Select--</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="Impact" name="impact">
              <select id="impact" name="impact" value={formData.impact} onChange={handleChange} disabled={readonly} className={inputClassName}>
                <option value="">--Select--</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </Field>
          </Section>

          {showWorkstationDetails && (
            <>
              <Section title="Computer Details">
                <Field label="Monitoring Protocol" name="workstation_monitoring_protocol">
                  <input id="workstation_monitoring_protocol" name="monitoring_protocol" value={workstationDetails.monitoring_protocol} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}/>
                </Field>
                <Field label="Bios Name" name="bios_name">
                  <input id="bios_name" name="bios_name" value={workstationDetails.bios_name} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}/>
                </Field>
                <Field label="Service Tag" name="workstation_service_tag">
                  <input id="workstation_service_tag" name="service_tag" value={workstationDetails.service_tag} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}/>
                </Field>
                <Field label="Bios Version" name="bios_version">
                  <input id="bios_version" name="bios_version" value={workstationDetails.bios_version} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}/>
                </Field>
                <Field label="Last Logged In User" name="last_logged_in_user">
                  <input id="last_logged_in_user" name="last_logged_in_user" value={workstationDetails.last_logged_in_user} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}/>
                </Field>
                <Field label="Bios Manufacturer" name="bios_manufacturer">
                  <input id="bios_manufacturer" name="bios_manufacturer" value={workstationDetails.bios_manufacturer} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}/>
                </Field>
                <Field label="Bios Date" name="bios_date">
                  <input id="bios_date" type="date" name="bios_date" value={workstationDetails.bios_date} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}/>
                </Field>
                <UnitField label="Total Memory" name="total_memory" unitName="total_memory_unit" workstationDetails={workstationDetails} onChange={handleWorkstationChange} readonly={readonly} inputClassName={inputClassName}/>
                <Field label="SMBios Version" name="smbios_version">
                  <input id="smbios_version" name="smbios_version" value={workstationDetails.smbios_version} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}/>
                </Field>
                <Field label="Domain" name="domain">
                  <select id="domain" name="domain" value={workstationDetails.domain} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}>
                    <option value="">--Select--</option>
                    <option value="Domain Joined">Domain Joined</option>
                    <option value="Workgroup">Workgroup</option>
                    <option value="Standalone">Standalone</option>
                  </select>
                </Field>
                <UnitField label="Virtual Memory" name="virtual_memory" unitName="virtual_memory_unit" workstationDetails={workstationDetails} onChange={handleWorkstationChange} readonly={readonly} inputClassName={inputClassName}/>
                <Field label="Total Slots" name="total_slots">
                  <input id="total_slots" name="total_slots" value={workstationDetails.total_slots} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}/>
                </Field>
                <Field label="Logical Processors" name="logical_processors">
                  <input id="logical_processors" name="logical_processors" value={workstationDetails.logical_processors} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}/>
                </Field>
              </Section>

              <Section title="OS">
                <Field label="Operating System" name="operating_system">
                  <input id="operating_system" name="operating_system" value={workstationDetails.operating_system} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}/>
                </Field>
                <Field label="OS Version" name="os_version">
                  <input id="os_version" name="os_version" value={workstationDetails.os_version} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}/>
                </Field>
                <Field label="Service Pack" name="service_pack">
                  <input id="service_pack" name="service_pack" value={workstationDetails.service_pack} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}/>
                </Field>
                <Field label="Product ID" name="workstation_product_id">
                  <input id="workstation_product_id" name="product_id" value={workstationDetails.product_id} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}/>
                </Field>
                <Field label="Build Number" name="build_number">
                  <input id="build_number" name="build_number" value={workstationDetails.build_number} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}/>
                </Field>
                <Field label="System Type" name="system_type">
                  <input id="system_type" name="system_type" value={workstationDetails.system_type} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}/>
                </Field>
                <Field label="License Type" name="license_type">
                  <input id="license_type" name="license_type" value={workstationDetails.license_type} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}/>
                </Field>
                <Field label="License Status" name="license_status">
                  <input id="license_status" name="license_status" value={workstationDetails.license_status} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}/>
                </Field>
                <Field label="System Drive" name="system_drive">
                  <input id="system_drive" name="system_drive" value={workstationDetails.system_drive} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}/>
                </Field>
              </Section>

              <Section title="Virtual Host Details">
                <Field label="VM Platform" name="vm_platform">
                  <select id="vm_platform" name="vm_platform" value={workstationDetails.vm_platform} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}>
                    <option value="">--Select--</option>
                    <option value="VMware">VMware</option>
                    <option value="Hyper-V">Hyper-V</option>
                    <option value="VirtualBox">VirtualBox</option>
                    <option value="KVM">KVM</option>
                  </select>
                </Field>
                <Field label="Installed VMs" name="installed_vms">
                  <input id="installed_vms" name="installed_vms" value={workstationDetails.installed_vms} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}/>
                </Field>
                <Field label="Allowed VMs" name="allowed_vms">
                  <input id="allowed_vms" name="allowed_vms" value={workstationDetails.allowed_vms} onChange={handleWorkstationChange} disabled={readonly} className={inputClassName}/>
                </Field>
              </Section>
            </>
          )}

          <Section title="CI Type Additional Fields Section" info>
            <Field label="Manufacturer" name="ci_manufacturer">
              <input id="ci_manufacturer" name="ci_manufacturer" value={formData.ci_manufacturer} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
            <Field label="Monitoring Protocol" name="monitoring_protocol">
              <input id="monitoring_protocol" name="monitoring_protocol" value={formData.monitoring_protocol} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
            <Field label="Uplink Dependency" name="uplink_dependency">
              <input id="uplink_dependency" name="uplink_dependency" value={formData.uplink_dependency} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
            <Field label="No. of Interfaces" name="number_of_interfaces">
              <input id="number_of_interfaces" name="number_of_interfaces" value={formData.number_of_interfaces} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
            <Field label="Serial Number" name="ci_serial_number">
              <input id="ci_serial_number" name="ci_serial_number" value={formData.ci_serial_number} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
            <Field label="Service Tag" name="service_tag">
              <input id="service_tag" name="service_tag" value={formData.service_tag} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
            <Field label="DNS Name" name="dns_name">
              <input id="dns_name" name="dns_name" value={formData.dns_name} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
            <Field label="Vendor" name="ci_vendor">
              <input id="ci_vendor" name="ci_vendor" value={formData.ci_vendor} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
            <Field label="System Description" name="system_description">
              <input id="system_description" name="system_description" value={formData.system_description} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
            <Field label="Type" name="ci_type">
              <input id="ci_type" name="ci_type" value={formData.ci_type} onChange={handleChange} disabled={readonly} className={inputClassName}/>
            </Field>
          </Section>

          <section className="border-t border-slate-200 pt-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">Network Adapters</h2>
              <span className="text-sm text-slate-500">Maximum records allowed : 100</span>
            </div>
            <div className="overflow-x-auto border border-slate-200 bg-white">
              <table className="min-w-[980px] w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-700">
                  <tr>
                    {networkAdapterFields.map(([field, label], index) => (
                      <th key={field} className="border-b border-r border-slate-200 px-3 py-2 last:border-r-0">
                        {index === 0 && <span className="mr-1 text-red-500">*</span>}
                        {label}
                      </th>
                    ))}
                    {!readonly && <th className="w-16 border-b border-slate-200 px-3 py-2">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {networkAdapters.length === 0 ? (
                    <tr>
                      <td colSpan={readonly ? networkAdapterFields.length : networkAdapterFields.length + 1} className="px-3 py-4 text-slate-500">
                        <span className="mr-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-white">i</span>
                        No data available
                        {!readonly && (
                          <button type="button" onClick={handleAddNetworkAdapter} className="ml-3 text-sm font-medium text-blue-600 hover:text-blue-700">
                            Add New
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    networkAdapters.map((adapter, adapterIndex) => (
                      <tr key={`network-adapter-${adapterIndex}`} className="border-b border-slate-200 last:border-b-0">
                        {networkAdapterFields.map(([field]) => (
                          <td key={field} className="border-r border-slate-200 px-2 py-2 last:border-r-0">
                            <input
                              value={adapter[field] || ''}
                              onChange={(event) => handleNetworkAdapterChange(adapterIndex, field, event.target.value)}
                              disabled={readonly}
                              className="h-8 w-full rounded border border-slate-300 px-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                            />
                          </td>
                        ))}
                        {!readonly && (
                          <td className="px-2 py-2">
                            <button type="button" onClick={() => handleRemoveNetworkAdapter(adapterIndex)} className="text-sm font-medium text-red-600 hover:text-red-700">
                              Remove
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!readonly && networkAdapters.length > 0 && networkAdapters.length < 100 && (
              <button type="button" onClick={handleAddNetworkAdapter} className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700">
                Add New
              </button>
            )}
          </section>

          {showWorkstationDetails && workstationHardwareConfigs.map((config) => (
            <WorkstationHardwareTable
              key={config.key}
              config={config}
              rows={workstationHardware[config.key] || []}
              readonly={readonly}
              onAdd={handleAddWorkstationHardwareRow}
              onChange={handleWorkstationHardwareChange}
              onRemove={handleRemoveWorkstationHardwareRow}
            />
          ))}
        </div>

        {!readonly && (<div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_12px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-wrap justify-center gap-3">
              <button type="submit" disabled={isSubmitting} className="inline-flex h-9 min-w-16 items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>}
                Save
              </button>
              <button type="button" onClick={() => handleSave(true)} disabled={isSubmitting} className="h-9 rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
                Save and Add New
              </button>
              <button type="button" onClick={onBack} disabled={isSubmitting} className="h-9 rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
                Cancel
              </button>
            </div>
          </div>)}
      </form>
    </div>);
};
export default AssetForm;

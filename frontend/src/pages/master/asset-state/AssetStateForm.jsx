import React, { useEffect, useState } from 'react';
import ButtonIcon from '../../../components/common/ButtonIcon';
import { createAssetState, updateAssetState } from '../../../services/api';
const AssetStateForm = ({ editing, onSave, onClose, saving }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        requires_ownership: false,
        requires_scan: false,
        active: true,
    });
    useEffect(() => {
        if (editing) {
            setFormData({
                name: editing.name || '',
                description: editing.description || '',
                requires_ownership: !!editing.requires_ownership,
                requires_scan: !!editing.requires_scan,
                active: editing.active !== false,
            });
        }
        else {
            setFormData({
                name: '',
                description: '',
                requires_ownership: false,
                requires_scan: false,
                active: true,
            });
        }
    }, [editing]);
    const handleChange = (event) => {
        const target = event.target;
        setFormData((prev) => ({
            ...prev,
            [target.name]: target.type === 'checkbox' ? target.checked : target.value,
        }));
    };
    const handleSave = async () => {
        if (saving || !formData.name.trim())
            return;
        try {
            if (editing) {
                await updateAssetState(editing.id, formData);
            }
            else {
                await createAssetState(formData);
            }
            onSave();
        }
        catch (error) {
            console.error('Error saving asset state:', error);
        }
    };
    const renderToggle = (name, label) => (<label className="flex items-center gap-3 text-sm font-medium text-slate-700">
      <input type="checkbox" name={name} checked={formData[name]} onChange={handleChange} className="sr-only"/>
      <span className={`relative inline-flex h-6 w-11 rounded-full transition ${formData[name] ? 'bg-blue-600' : 'bg-slate-200'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${formData[name] ? 'left-6' : 'left-1'}`}></span>
      </span>
      {label}
    </label>);
    return (<div className="space-y-5">
      <div>
        <label htmlFor="asset_state_name" className="block text-sm font-medium text-slate-700">
          Name
        </label>
        <input id="asset_state_name" name="name" type="text" value={formData.name} onChange={handleChange} className="mt-2 block w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
      </div>

      <div>
        <label htmlFor="asset_state_description" className="block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea id="asset_state_description" name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Enter description" className="mt-2 block w-full rounded-md border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
      </div>

      <div className="space-y-4">
        {renderToggle('requires_ownership', 'Requires Ownership')}
        {renderToggle('requires_scan', 'Requires Scan')}
        {renderToggle('active', 'Active')}
      </div>

      <div className="flex justify-center gap-3 pt-3">
        <button type="button" onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <ButtonIcon type="close" /> Close
        </button>
        <button type="button" onClick={handleSave} disabled={saving || !formData.name.trim()} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70">
          {saving ? (<><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>Saving...</>) : (<><ButtonIcon type="save" />Save</>)}
        </button>
      </div>
    </div>);
};
export default AssetStateForm;

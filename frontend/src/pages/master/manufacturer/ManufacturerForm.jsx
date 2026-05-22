import React, { useEffect, useState } from 'react';
import { createManufacturer, updateManufacturer } from '../../../services/api';
const ManufacturerForm = ({ editing, onSave, onClose, saving }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        active: true,
    });
    useEffect(() => {
        if (editing) {
            setFormData({
                name: editing.name || '',
                description: editing.description || '',
                active: editing.active !== false,
            });
        }
        else {
            setFormData({
                name: '',
                description: '',
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
                await updateManufacturer(editing.id, formData);
            }
            else {
                await createManufacturer(formData);
            }
            onSave();
        }
        catch (error) {
            console.error('Error saving manufacturer:', error);
        }
    };
    return (<div className="space-y-5">
      <div>
        <label htmlFor="manufacturer_name" className="block text-sm font-medium text-slate-700">
          <span className="text-red-500">*</span> Name
        </label>
        <input id="manufacturer_name" name="name" type="text" value={formData.name} onChange={handleChange} required className="mt-2 block w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
      </div>

      <div>
        <label htmlFor="manufacturer_description" className="block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea id="manufacturer_description" name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Enter your message" className="mt-2 block w-full rounded-md border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
      </div>

      <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
        <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
        Active
      </label>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
          Close
        </button>
        <button type="button" onClick={handleSave} disabled={saving || !formData.name.trim()} className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>);
};
export default ManufacturerForm;

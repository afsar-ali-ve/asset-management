import React, { useEffect, useState } from 'react';
import { createSoftwareCategory, updateSoftwareCategory } from '../../../services/api';
const SoftwareCategoryForm = ({ editing, onSave, onClose, saving }) => {
    const [formData, setFormData] = useState({
        display_name: '',
        description: '',
        active: true,
    });
    useEffect(() => {
        if (editing) {
            setFormData({
                display_name: editing.display_name || '',
                description: editing.description || '',
                active: !!editing.active,
            });
        }
        else {
            setFormData({
                display_name: '',
                description: '',
                active: true,
            });
        }
    }, [editing]);
    const handleChange = (e) => {
        const target = e.target;
        const name = target.name;
        const value = target.value;
        const type = target.type;
        const checked = 'checked' in target ? target.checked : false;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };
    const handleSave = async () => {
        if (saving || !formData.display_name.trim())
            return;
        try {
            if (editing) {
                await updateSoftwareCategory(editing.id, formData);
            }
            else {
                await createSoftwareCategory(formData);
            }
            onSave();
        }
        catch (error) {
            console.error('Error saving software category:', error);
        }
    };
    return (<div className="space-y-6">
      <div>
        <label htmlFor="display_name" className="block text-sm font-medium text-slate-700">
          Software Category <span className="text-red-500">*</span>
        </label>
        <input id="display_name" name="display_name" type="text" value={formData.display_name} onChange={handleChange} required className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Enter description" className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
          Active
        </label>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
          Close
        </button>
        <button type="button" onClick={handleSave} disabled={saving || !formData.display_name.trim()} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>);
};
export default SoftwareCategoryForm;

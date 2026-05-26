import React, { useEffect, useState } from 'react';
import ButtonIcon from '../../../components/common/ButtonIcon';
import { createSoftwareLicenseType, getManufacturers, updateSoftwareLicenseType, } from '../../../services/api';
const trackByOptions = ['Workstation', 'User', 'CAL'];
const installationAllowedOptions = ['Unlimited', 'Volume', 'Single', 'OEM'];
const SoftwareLicenseTypeForm = ({ editing, onSave, onClose, saving }) => {
    const [manufacturers, setManufacturers] = useState([]);
    const [formData, setFormData] = useState({
        license_type: '',
        manufacturer: '',
        track_by: '',
        installation_allowed: '',
        is_perpetual: false,
        is_free_license: false,
        license_option: '',
        active: true,
    });
    useEffect(() => {
        getManufacturers()
            .then((response) => setManufacturers(response.data.filter((item) => item.active)))
            .catch((error) => console.error('Error fetching manufacturers:', error));
    }, []);
    useEffect(() => {
        if (editing) {
            setFormData({
                license_type: editing.license_type || '',
                manufacturer: editing.manufacturer || '',
                track_by: editing.track_by || '',
                installation_allowed: editing.installation_allowed || '',
                is_perpetual: !!editing.is_perpetual,
                is_free_license: !!editing.is_free_license,
                license_option: editing.license_option || '',
                active: editing.active !== false,
            });
        }
        else {
            setFormData({
                license_type: '',
                manufacturer: '',
                track_by: '',
                installation_allowed: '',
                is_perpetual: false,
                is_free_license: false,
                license_option: '',
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
    const isValid = formData.license_type.trim() &&
        formData.manufacturer.trim() &&
        formData.track_by.trim() &&
        formData.installation_allowed.trim() &&
        formData.license_option.trim();
    const handleSave = async () => {
        if (saving || !isValid)
            return;
        try {
            if (editing) {
                await updateSoftwareLicenseType(editing.id, formData);
            }
            else {
                await createSoftwareLicenseType(formData);
            }
            onSave();
        }
        catch (error) {
            console.error('Error saving software license type:', error);
        }
    };
    const renderToggle = (name, label) => (<label className="flex items-center gap-3 text-sm font-medium text-slate-700">
      <input type="checkbox" name={name} checked={formData[name]} onChange={handleChange} className="sr-only"/>
      <span className={`relative inline-flex h-6 w-11 rounded-full transition ${formData[name] ? 'bg-blue-600' : 'bg-slate-200'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${formData[name] ? 'left-6' : 'left-1'}`}></span>
      </span>
      {label}
    </label>);
    return (<div className="space-y-3">
      <div>
        <label htmlFor="license_type" className="block text-sm font-medium text-slate-700">
          <span className="text-red-500">*</span> License Type
        </label>
        <input id="license_type" name="license_type" type="text" value={formData.license_type} onChange={handleChange} className="mt-2 block w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
      </div>

      <div>
        <label htmlFor="manufacturer" className="block text-sm font-medium text-slate-700">
          <span className="text-red-500">*</span> Manufacturer
        </label>
        <select id="manufacturer" name="manufacturer" value={formData.manufacturer} onChange={handleChange} className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          <option value="">---select manufacturer---</option>
          {manufacturers.map((manufacturer) => (<option key={manufacturer.id} value={manufacturer.name}>
              {manufacturer.name}
            </option>))}
        </select>
      </div>

      <div>
        <label htmlFor="track_by" className="block text-sm font-medium text-slate-700">
          <span className="text-red-500">*</span> Track By
        </label>
        <select id="track_by" name="track_by" value={formData.track_by} onChange={handleChange} className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          <option value="">---select track by---</option>
          {trackByOptions.map((option) => (<option key={option} value={option}>
              {option}
            </option>))}
        </select>
      </div>

      <div>
        <label htmlFor="installation_allowed" className="block text-sm font-medium text-slate-700">
          <span className="text-red-500">*</span> Installation(s) Allowed
        </label>
        <select id="installation_allowed" name="installation_allowed" value={formData.installation_allowed} onChange={handleChange} className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          <option value="">---select installation allowed---</option>
          {installationAllowedOptions.map((option) => (<option key={option} value={option}>
              {option}
            </option>))}
        </select>
      </div>

      <div className="space-y-2">
        {renderToggle('is_perpetual', 'Is Perpetual')}
        {renderToggle('is_free_license', 'Is FreeLicense')}
      </div>

      <div>
        <label htmlFor="license_option" className="block text-sm font-medium text-slate-700">
          <span className="text-red-500">*</span> License Option
        </label>
        <input id="license_option" name="license_option" type="text" value={formData.license_option} onChange={handleChange} className="mt-2 block w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
      </div>

      <div className="flex justify-center gap-3 pt-1">
        <button type="button" onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <ButtonIcon type="close" /> Close
        </button>
        <button type="button" onClick={handleSave} disabled={saving || !isValid} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70">
          {saving ? (<><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>Saving...</>) : (<><ButtonIcon type="save" />Save</>)}
        </button>
      </div>
    </div>);
};
export default SoftwareLicenseTypeForm;

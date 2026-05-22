import React, { useState, useEffect } from 'react';
const VendorForm = ({ editing, onSave, onClose, saving }) => {
    const [formData, setFormData] = useState({
        name: '',
        currency: '',
        contactPerson: '',
        email: '',
        phone: '',
        website: '',
        description: '',
    });
    useEffect(() => {
        if (editing) {
            setFormData({
                name: editing.name || '',
                currency: editing.currency || '',
                contactPerson: editing.contactPerson || '',
                email: editing.email || '',
                phone: editing.phone || '',
                website: editing.website || '',
                description: editing.description || '',
            });
        }
        else {
            setFormData({
                name: '',
                currency: '',
                contactPerson: '',
                email: '',
                phone: '',
                website: '',
                description: '',
            });
        }
    }, [editing]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        onSave(formData);
    };
    return (<form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Enter vendor name" required className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
            </div>
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-slate-700">
                Currency
              </label>
              <input type="text" id="currency" name="currency" value={formData.currency} onChange={handleChange} placeholder="Enter currency" className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
            </div>
            <div>
              <label htmlFor="contactPerson" className="block text-sm font-medium text-slate-700">
                Contact Person <span className="text-red-500">*</span>
              </label>
              <input type="text" id="contactPerson" name="contactPerson" value={formData.contactPerson} onChange={handleChange} placeholder="Enter contact person" required className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email address" required className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                Phone
              </label>
              <input type="text" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter phone number" className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
            </div>
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-slate-700">
                Website
              </label>
              <input type="url" id="website" name="website" value={formData.website} onChange={handleChange} placeholder="Enter website URL" className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Enter description" rows={3} className="mt-2 block w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Close
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70">
              {saving ? (<span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></span>) : null}
              Save
            </button>
          </div>
        </form>);
};
export default VendorForm;

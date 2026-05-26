import React, { useEffect, useMemo, useRef, useState } from 'react';
import ButtonIcon from '../../../components/common/ButtonIcon';
const manufacturerOptions = ['Manufacturer A', 'Manufacturer B', 'Manufacturer C'];
const getProductTypeId = (value) => {
    if (!value) {
        return '';
    }
    if (typeof value === 'object' && value !== null && 'id' in value) {
        return String(value.id);
    }
    return String(value);
};
const ProductForm = ({ editing, onSave, onClose, productTypes, saving }) => {
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        productType: '',
        manufacturer: '',
        partNo: '',
        cost: '',
        description: '',
        active: true,
    });
    const [productTypePickerOpen, setProductTypePickerOpen] = useState(false);
    const [expandedProductTypeIds, setExpandedProductTypeIds] = useState(new Set());
    const productTypePickerRef = useRef(null);
    useEffect(() => {
        if (editing) {
            setFormData(editing);
        }
        else {
            setFormData({
                id: null,
                name: '',
                productType: '',
                manufacturer: '',
                partNo: '',
                cost: '',
                description: '',
                active: true,
            });
        }
    }, [editing]);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (productTypePickerRef.current && !productTypePickerRef.current.contains(event.target)) {
                setProductTypePickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    useEffect(() => {
        setExpandedProductTypeIds(new Set(productTypes.map((productType) => productType.id)));
    }, [productTypes]);
    const productTypeTree = useMemo(() => {
        const nodeMap = new Map();
        const roots = [];
        productTypes.forEach((productType) => {
            nodeMap.set(productType.id, { ...productType, children: [] });
        });
        nodeMap.forEach((node) => {
            const parentId = getProductTypeId(node.parent_product_type);
            const parent = parentId ? nodeMap.get(parentId) : null;
            if (parent) {
                parent.children.push(node);
            }
            else {
                roots.push(node);
            }
        });
        const sortNodes = (nodes) => {
            nodes.sort((a, b) => a.display_name.localeCompare(b.display_name));
            nodes.forEach((node) => sortNodes(node.children));
        };
        sortNodes(roots);
        return roots;
    }, [productTypes]);
    const selectedProductType = useMemo(() => {
        return productTypes.find((productType) => productType.id === formData.productType) ?? null;
    }, [formData.productType, productTypes]);
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        let checked = false;
        if (type === 'checkbox' && 'checked' in e.target) {
            checked = e.target.checked;
        }
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };
    const handleSubmit = async () => {
        if (!saving) {
            await onSave(formData);
        }
    };
    const handleProductTypeSelect = (productTypeId) => {
        setFormData((currentData) => ({ ...currentData, productType: productTypeId }));
        setProductTypePickerOpen(false);
    };
    const handleToggleExpanded = (productTypeId) => {
        setExpandedProductTypeIds((currentIds) => {
            const nextIds = new Set(currentIds);
            if (nextIds.has(productTypeId)) {
                nextIds.delete(productTypeId);
            }
            else {
                nextIds.add(productTypeId);
            }
            return nextIds;
        });
    };
    const renderProductTypeNode = (node, depth = 0) => {
        const isExpanded = expandedProductTypeIds.has(node.id);
        const isSelected = formData.productType === node.id;
        const hasChildren = node.children.length > 0;
        return (<div key={node.id}>
        <div className={`flex items-center rounded px-2 py-1.5 text-sm ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`} style={{ paddingLeft: `${depth * 22 + 8}px` }}>
          <button type="button" onClick={() => hasChildren && handleToggleExpanded(node.id)} className="mr-2 flex h-4 w-4 items-center justify-center text-slate-500" aria-label={isExpanded ? `Collapse ${node.display_name}` : `Expand ${node.display_name}`}>
            {hasChildren ? (isExpanded ? '\u25BE' : '\u25B8') : ''}
          </button>
          <button type="button" onClick={() => handleProductTypeSelect(node.id)} className="min-w-0 flex-1 truncate text-left">
            {node.display_name}
          </button>
        </div>
        {hasChildren && isExpanded && node.children.map((childNode) => renderProductTypeNode(childNode, depth + 1))}
      </div>);
    };
    return (<div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
          <input name="name" value={formData.name} onChange={handleChange} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder=""/>
        </div>

        <div>
          <label htmlFor="product_type_button" className="block text-sm font-medium text-slate-700 mb-1">Product Type</label>
          <div ref={productTypePickerRef} className="relative">
            <button id="product_type_button" type="button" onClick={() => setProductTypePickerOpen((isOpen) => !isOpen)} className="flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <span className={selectedProductType ? 'truncate text-slate-900' : 'truncate text-slate-500'}>
                {selectedProductType ? selectedProductType.display_name : 'Select Product Type'}
              </span>
              <span className="ml-3 text-slate-500" aria-hidden="true">
                {productTypePickerOpen ? '\u25B4' : '\u25BE'}
              </span>
            </button>
            {productTypePickerOpen && (<div className="absolute left-0 right-0 z-20 mt-2 max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 shadow-xl">
                <button type="button" onClick={() => handleProductTypeSelect('')} className={`mb-1 w-full rounded px-2 py-1.5 text-left text-sm ${formData.productType ? 'text-slate-700 hover:bg-slate-50' : 'bg-blue-50 text-blue-700'}`}>
                  Select Product Type
                </button>
                {productTypeTree.length > 0 ? (productTypeTree.map((node) => renderProductTypeNode(node))) : (<div className="px-2 py-3 text-sm text-slate-500">No product types available</div>)}
              </div>)}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Manufacturer</label>
          <select name="manufacturer" value={formData.manufacturer} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select Manufacturer</option>
            {manufacturerOptions.map((manufacturer) => (<option key={manufacturer} value={manufacturer}>
                {manufacturer}
              </option>))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Part No</label>
          <input name="partNo" value={formData.partNo} onChange={handleChange} type="text" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder=""/>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cost ($)</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-600">$</span>
            <input name="cost" value={formData.cost} onChange={handleChange} type="number" min="0" step="0.01" className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder=""/>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Active</label>
          <div className="flex items-center">
            <input name="active" type="checkbox" checked={formData.active} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
            <span className="ml-2 text-sm text-slate-700">Yes</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
        <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter product description"/>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Images</label>
        <div className="border-2 border-dashed border-slate-300 rounded-md p-6 text-center">
          <div className="text-gray-400 text-sm">
            <div className="text-2xl mb-1">+</div>
            <div>Add Image</div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">
          <ButtonIcon type="close" /> Close
        </button>
        <button type="button" onClick={handleSubmit} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center justify-center" disabled={saving}>
          {saving ? (<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>) : (<ButtonIcon type="save" />)} Save
        </button>
      </div>
    </div>);
};
export default ProductForm;

import React, { useState, useEffect, useMemo, useRef } from 'react';
import ButtonIcon from '../../../components/common/ButtonIcon';
import { createProductType, updateProductType } from '../../../services/api';
const categoryOptions = ['Asset', 'Consumable'];
const assetTypeOptions = ['Asset', 'Consumable', 'Component'];
const assetCategoryTypeOptions = ['IT', 'Non IT'];
const getProductTypeId = (value) => {
    if (!value) {
        return '';
    }
    if (typeof value === 'object' && value !== null && 'id' in value) {
        return String(value.id);
    }
    return String(value);
};
const ProductTypeForm = ({ editing, onSave, onClose, productTypes, saving, parentProductTypeId = '', parentLocked = false }) => {
    const [formData, setFormData] = useState({
        display_name: '',
        api_name: '',
        display_plural_name: '',
        api_plural_name: '',
        category: '',
        parent_product_type: '',
        asset_type: '',
        asset_category_type: '',
        description: '',
    });
    const [parentPickerOpen, setParentPickerOpen] = useState(false);
    const [expandedProductTypeIds, setExpandedProductTypeIds] = useState(new Set());
    const [parentExplicitNoParent, setParentExplicitNoParent] = useState(false);
    const [errors, setErrors] = useState({});
    const parentPickerRef = useRef(null);
    useEffect(() => {
        if (editing) {
            setFormData({
                display_name: editing.display_name || '',
                api_name: editing.api_name || '',
                display_plural_name: editing.display_plural_name || '',
                api_plural_name: editing.api_plural_name || '',
                category: editing.category || '',
                parent_product_type: getProductTypeId(editing.parent_product_type),
                asset_type: editing.asset_type || '',
                asset_category_type: editing.asset_category_type || '',
                description: editing.description || '',
            });
            setParentExplicitNoParent(!getProductTypeId(editing.parent_product_type));
        }
        else {
            setFormData({
                display_name: '',
                api_name: '',
                display_plural_name: '',
                api_plural_name: '',
                category: '',
                parent_product_type: parentProductTypeId,
                asset_type: '',
                asset_category_type: '',
                description: '',
            });
            setParentExplicitNoParent(false);
        }
        setErrors({});
    }, [editing, parentProductTypeId]);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (parentPickerRef.current && !parentPickerRef.current.contains(event.target)) {
                setParentPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const excludedProductTypeIds = useMemo(() => {
        if (!editing) {
            return new Set();
        }
        const childrenByParent = productTypes.reduce((acc, productType) => {
            const parentId = getProductTypeId(productType.parent_product_type);
            if (!parentId) {
                return acc;
            }
            acc[parentId] = [...(acc[parentId] ?? []), productType.id];
            return acc;
        }, {});
        const excludedIds = new Set([editing.id]);
        const stack = [...(childrenByParent[editing.id] ?? [])];
        while (stack.length > 0) {
            const id = stack.pop();
            if (!id || excludedIds.has(id)) {
                continue;
            }
            excludedIds.add(id);
            stack.push(...(childrenByParent[id] ?? []));
        }
        return excludedIds;
    }, [editing, productTypes]);
    const parentProductTypeTree = useMemo(() => {
        const nodeMap = new Map();
        const roots = [];
        productTypes.forEach((productType) => {
            if (!excludedProductTypeIds.has(productType.id)) {
                nodeMap.set(productType.id, { ...productType, children: [] });
            }
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
    }, [excludedProductTypeIds, productTypes]);
    const selectedParentProductType = useMemo(() => {
        return productTypes.find((productType) => productType.id === formData.parent_product_type) ?? null;
    }, [formData.parent_product_type, productTypes]);
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors((currentErrors) => {
            if (!currentErrors[e.target.name]) {
                return currentErrors;
            }
            const nextErrors = { ...currentErrors };
            delete nextErrors[e.target.name];
            return nextErrors;
        });
    };
    const parentSelectionIsValid = Boolean(formData.parent_product_type) || parentExplicitNoParent;
    const requiredFieldsAreValid = Boolean(formData.display_name.trim() &&
        formData.api_name.trim() &&
        formData.display_plural_name.trim() &&
        formData.api_plural_name.trim() &&
        formData.category &&
        formData.asset_type &&
        formData.asset_category_type);
    const formIsValid = requiredFieldsAreValid && parentSelectionIsValid;
    const validateForm = () => {
        const nextErrors = {};
        if (!parentSelectionIsValid) {
            nextErrors.parent_product_type = 'Please select Parent Product Type';
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0 && requiredFieldsAreValid;
    };
    const parentProductTypeError = errors.parent_product_type || (requiredFieldsAreValid && !parentSelectionIsValid ? 'Please select Parent Product Type' : '');
    const handleParentPickerToggle = () => {
        if (parentLocked) {
            return;
        }
        if (parentPickerOpen && !parentSelectionIsValid) {
            setErrors((currentErrors) => ({ ...currentErrors, parent_product_type: 'Please select Parent Product Type' }));
        }
        setParentPickerOpen((isOpen) => {
            const nextOpen = !isOpen;
            if (nextOpen) {
                setExpandedProductTypeIds(new Set());
            }
            return nextOpen;
        });
    };
    const handleParentSelect = (productTypeId) => {
        if (parentLocked) {
            return;
        }
        setParentExplicitNoParent(!productTypeId);
        setFormData((currentFormData) => ({ ...currentFormData, parent_product_type: productTypeId }));
        setErrors((currentErrors) => {
            const nextErrors = { ...currentErrors };
            delete nextErrors.parent_product_type;
            return nextErrors;
        });
        setParentPickerOpen(false);
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
    const renderParentProductTypeNode = (node, depth = 0) => {
        const isExpanded = expandedProductTypeIds.has(node.id);
        const isSelected = formData.parent_product_type === node.id;
        const hasChildren = node.children.length > 0;
        return (<div key={node.id}>
        <div className={`flex items-center rounded px-2 py-1.5 text-sm ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`} style={{ paddingLeft: `${depth * 22 + 8}px` }}>
          <button type="button" onClick={() => hasChildren && handleToggleExpanded(node.id)} className="mr-2 flex h-4 w-4 items-center justify-center text-slate-500" aria-label={isExpanded ? `Collapse ${node.display_name}` : `Expand ${node.display_name}`}>
            {hasChildren ? (isExpanded ? '\u25BE' : '\u25B8') : ''}
          </button>
          <button type="button" onClick={() => handleParentSelect(node.id)} className="min-w-0 flex-1 truncate text-left">
            {node.display_name}
          </button>
        </div>
        {hasChildren && isExpanded && node.children.map((childNode) => renderParentProductTypeNode(childNode, depth + 1))}
      </div>);
    };
    const handleSaveClick = async () => {
        if (!saving) {
            if (!validateForm()) {
                return;
            }
            try {
                const payload = {
                    ...formData,
                    parent_product_type: formData.parent_product_type || null,
                    allow_no_parent: parentExplicitNoParent,
                };
                if (editing) {
                    await updateProductType(editing.id, payload);
                }
                else {
                    await createProductType(payload);
                }
                onSave();
            }
            catch (error) {
                console.error('Error saving product type:', error);
            }
        }
    };
    return (<form className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="display_name" className="block text-sm font-medium text-slate-700">
            Display Name <span className="text-red-500">*</span>
          </label>
          <input type="text" id="display_name" name="display_name" value={formData.display_name} onChange={handleChange} required className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
        </div>
        <div>
          <label htmlFor="api_name" className="block text-sm font-medium text-slate-700">
            API Name <span className="text-red-500">*</span>
          </label>
          <input type="text" id="api_name" name="api_name" value={formData.api_name} onChange={handleChange} required className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
        </div>
        <div>
          <label htmlFor="display_plural_name" className="block text-sm font-medium text-slate-700">
            Display Plural Name <span className="text-red-500">*</span>
          </label>
          <input type="text" id="display_plural_name" name="display_plural_name" value={formData.display_plural_name} onChange={handleChange} required className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
        </div>
        <div>
          <label htmlFor="api_plural_name" className="block text-sm font-medium text-slate-700">
            API Plural Name <span className="text-red-500">*</span>
          </label>
          <input type="text" id="api_plural_name" name="api_plural_name" value={formData.api_plural_name} onChange={handleChange} required className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-700">
            Category <span className="text-red-500">*</span>
          </label>
          <select id="category" name="category" value={formData.category} onChange={handleChange} required className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="">-- Select Category --</option>
            {categoryOptions.map((option) => (<option key={option} value={option}>
                {option}
              </option>))}
          </select>
        </div>
        <div>
          <label htmlFor="parent_product_type_button" className="block text-sm font-medium text-slate-700">
            Parent Product Type
          </label>
          <div ref={parentPickerRef} className="relative mt-1">
            <button id="parent_product_type_button" type="button" onClick={handleParentPickerToggle} disabled={parentLocked} className={`flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-left text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${parentProductTypeError ? 'border-red-400 ring-2 ring-red-500/20' : 'border-slate-300'}`}>
              <span className={selectedParentProductType || parentExplicitNoParent ? 'truncate text-slate-900' : 'truncate text-slate-500'}>
                {selectedParentProductType ? selectedParentProductType.display_name : (parentExplicitNoParent ? 'No Parent' : '-- Select Parent --')}
              </span>
              <span className="ml-3 text-slate-500" aria-hidden="true">
                {parentLocked ? '' : (parentPickerOpen ? '\u25B4' : '\u25BE')}
              </span>
            </button>
            {parentProductTypeError && <p className="mt-1 text-xs font-medium text-red-600">{parentProductTypeError}</p>}
            {parentPickerOpen && (<div className="absolute left-0 right-0 z-20 mt-2 max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-white p-2 shadow-xl">
                <button type="button" onClick={() => handleParentSelect('')} className={`mb-1 w-full rounded px-2 py-1.5 text-left text-sm ${formData.parent_product_type ? 'text-slate-700 hover:bg-slate-50' : 'bg-blue-50 text-blue-700'}`}>
                  No Parent
                </button>
                {parentProductTypeTree.length > 0 ? (parentProductTypeTree.map((node) => renderParentProductTypeNode(node))) : (<div className="px-2 py-3 text-sm text-slate-500">No product types available</div>)}
              </div>)}
          </div>
        </div>
        <div>
          <label htmlFor="asset_type" className="block text-sm font-medium text-slate-700">
            Asset Type <span className="text-red-500">*</span>
          </label>
          <select id="asset_type" name="asset_type" value={formData.asset_type} onChange={handleChange} required className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="">-- Select Asset Type --</option>
            {assetTypeOptions.map((option) => (<option key={option} value={option}>
                {option}
              </option>))}
          </select>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">
            Description
          </label>
          <input type="text" id="description" name="description" value={formData.description} onChange={handleChange} className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"/>
        </div>
        <div>
          <label htmlFor="asset_category_type" className="block text-sm font-medium text-slate-700">
            Asset Category Type <span className="text-red-500">*</span>
          </label>
          <select id="asset_category_type" name="asset_category_type" value={formData.asset_category_type} onChange={handleChange} required className="mt-2 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="">-- Select Asset Category --</option>
            {assetCategoryTypeOptions.map((option) => (<option key={option} value={option}>
                {option}
              </option>))}
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <ButtonIcon type="close" /> Close
        </button>
        <button type="button" onClick={handleSaveClick} className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-60" disabled={saving || !formIsValid}>
          {saving ? (<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></span>) : (<ButtonIcon type="save" />)} Save
        </button>
      </div>
    </form>);
};
export default ProductTypeForm;

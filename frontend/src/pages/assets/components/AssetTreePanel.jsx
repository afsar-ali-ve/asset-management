import React, { useEffect, useMemo, useState } from 'react';
const EXPANDED_STORAGE_KEY = 'assetTreeExpandedNodes';
const SELECTED_STORAGE_KEY = 'assetTreeSelectedNode';
const getParentProductTypeId = (value) => {
    if (!value) {
        return '';
    }
    if (typeof value === 'object' && value !== null && 'id' in value) {
        return String(value.id);
    }
    return String(value);
};
const readExpandedProductTypeIds = () => {
    try {
        const storedValue = localStorage.getItem(EXPANDED_STORAGE_KEY);
        const parsedValue = storedValue ? JSON.parse(storedValue) : [];
        return new Set(Array.isArray(parsedValue) ? parsedValue : []);
    }
    catch (error) {
        return new Set();
    }
};
const persistExpandedProductTypeIds = (ids) => {
    localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify([...ids]));
};
const persistSelectedProductTypeId = (id) => {
    if (id) {
        localStorage.setItem(SELECTED_STORAGE_KEY, id);
    }
    else {
        localStorage.removeItem(SELECTED_STORAGE_KEY);
    }
};
const AssetTreePanel = ({ productTypes, selectedCategory, onSelectCategory, loading, error, }) => {
    const [expandedProductTypeIds, setExpandedProductTypeIds] = useState(readExpandedProductTypeIds);
    const productTypeTree = useMemo(() => {
        const nodeMap = new Map();
        const roots = [];
        productTypes.forEach((productType) => {
            nodeMap.set(productType.id, { ...productType, children: [] });
        });
        nodeMap.forEach((node) => {
            const parentId = getParentProductTypeId(node.parent_product_type);
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
    useEffect(() => {
        if (!selectedCategory) {
            return;
        }
        persistSelectedProductTypeId(selectedCategory);
    }, [selectedCategory]);
    const handleToggleProductType = (productTypeId) => {
        setExpandedProductTypeIds((currentIds) => {
            const nextIds = new Set(currentIds);
            if (nextIds.has(productTypeId)) {
                nextIds.delete(productTypeId);
            }
            else {
                nextIds.add(productTypeId);
            }
            persistExpandedProductTypeIds(nextIds);
            return nextIds;
        });
    };
    const renderProductTypeNode = (node, depth = 0) => {
        const hasChildren = node.children.length > 0;
        const expanded = expandedProductTypeIds.has(node.id);
        const selected = selectedCategory === node.id;
        return (<div key={node.id}>
        <div className={`flex items-center rounded-md text-sm transition ${selected ? 'bg-slate-100 text-slate-950' : 'text-slate-700 hover:bg-slate-50'}`} style={{ paddingLeft: `${depth * 18 + 8}px` }}>
          <button type="button" onClick={() => hasChildren && handleToggleProductType(node.id)} className="flex h-8 w-6 shrink-0 items-center justify-center text-slate-500" aria-label={expanded ? `Collapse ${node.display_name}` : `Expand ${node.display_name}`}>
            {hasChildren ? (expanded ? '\u25BE' : '\u25B8') : ''}
          </button>
          <button type="button" onClick={() => {
                onSelectCategory(node.id);
                persistSelectedProductTypeId(node.id);
                if (hasChildren) {
                    setExpandedProductTypeIds((currentIds) => {
                        const nextIds = new Set(currentIds);
                        nextIds.add(node.id);
                        persistExpandedProductTypeIds(nextIds);
                        return nextIds;
                    });
                }
            }} className="min-w-0 flex-1 truncate py-2 pr-3 text-left" title={node.display_name}>
            {node.display_name}
          </button>
        </div>
        {hasChildren && expanded && node.children.map((childNode) => renderProductTypeNode(childNode, depth + 1))}
      </div>);
    };
    return (<div className="w-full max-w-[250px] rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="h-[calc(100vh-116px)] overflow-auto px-2 py-3">
        <div className="space-y-0.5">
          {loading && (<div className="flex items-center justify-center px-3 py-3" role="status" aria-label="Loading product types">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"/>
              <span className="sr-only">Loading product types</span>
            </div>)}
          {!loading && error && <div className="px-3 py-3 text-sm text-red-600">{error}</div>}
          {!loading && !error && productTypeTree.length === 0 && (<div className="px-3 py-3 text-sm text-slate-500">No product types found</div>)}
          {!loading && !error && productTypeTree.map((node) => renderProductTypeNode(node))}
        </div>
      </div>
    </div>);
};
export default AssetTreePanel;

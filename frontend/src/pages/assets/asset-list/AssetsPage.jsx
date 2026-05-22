import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AssetTreePanel from '../components/AssetTreePanel';
import AssetToolbar from './AssetToolbar';
import AssetTable, { assetColumns } from './AssetTable';
import AssetForm from '../asset-form/AssetForm';
import DeleteConfirmModal from '../../../components/common/DeleteConfirmModal';
import { deleteAsset, getAssetStates, getAssets, getProductTypes, getProducts, getVendors, } from '../../../services/api';
const ASSET_TREE_SELECTED_NODE_KEY = 'assetTreeSelectedNode';
const readSelectedProductTypeId = () => localStorage.getItem(ASSET_TREE_SELECTED_NODE_KEY) || '';
const persistSelectedProductTypeId = (id) => {
    if (id) {
        localStorage.setItem(ASSET_TREE_SELECTED_NODE_KEY, id);
    }
    else {
        localStorage.removeItem(ASSET_TREE_SELECTED_NODE_KEY);
    }
};
const AssetsPage = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState(readSelectedProductTypeId);
    const [selectedRows, setSelectedRows] = useState([]);
    const [productTypes, setProductTypes] = useState([]);
    const [assets, setAssets] = useState([]);
    const [products, setProducts] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [assetStates, setAssetStates] = useState([]);
    const [loadingProductTypes, setLoadingProductTypes] = useState(false);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [productTypesError, setProductTypesError] = useState(null);
    const [assetsError, setAssetsError] = useState(null);
    const [mode, setMode] = useState('list');
    const [editingAsset, setEditingAsset] = useState(null);
    const [saving, setSaving] = useState(false);
    const [visibleAssetColumns, setVisibleAssetColumns] = useState(assetColumns.map((column) => column.field));
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');
    const selectedProductTypeName = productTypes.find((productType) => productType.id === selectedCategory)?.display_name || '';
    const handleSelectCategory = useCallback((productTypeId) => {
        setSelectedCategory(productTypeId);
        persistSelectedProductTypeId(productTypeId);
    }, []);
    useEffect(() => {
        const fetchLookups = async () => {
            setLoadingProductTypes(true);
            setProductTypesError(null);
            try {
                const [productTypesResponse, productsResponse, vendorsResponse, assetStatesResponse] = await Promise.all([
                    getProductTypes(),
                    getProducts(),
                    getVendors(),
                    getAssetStates(),
                ]);
                setProductTypes(productTypesResponse.data);
                setProducts(productsResponse.data);
                setVendors(vendorsResponse.data);
                setAssetStates(assetStatesResponse.data);
            }
            catch (error) {
                console.error('Error fetching asset lookups:', error);
                setProductTypesError('Unable to load product types');
            }
            finally {
                setLoadingProductTypes(false);
            }
        };
        fetchLookups();
    }, []);
    const fetchAssets = useCallback(async () => {
        setLoadingAssets(true);
        setAssetsError(null);
        try {
            const response = await getAssets(selectedCategory);
            setAssets(response.data);
            setSelectedRows([]);
        }
        catch (error) {
            console.error('Error fetching assets:', error);
            setAssetsError('Unable to load assets');
        }
        finally {
            setLoadingAssets(false);
        }
    }, [selectedCategory]);
    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);
    const handleShowList = () => {
        setMode('list');
        setEditingAsset(null);
    };
    const handleSaveAsset = async () => {
        setSaving(true);
        try {
            await fetchAssets();
        }
        finally {
            setSaving(false);
        }
    };
    const handleDeleteSelected = async () => {
        if (selectedRows.length === 0) {
            return;
        }
        setDeleteError('');
        setDeleteModalOpen(true);
    };
    const handleConfirmDeleteSelected = async () => {
        if (selectedRows.length === 0) {
            return;
        }
        setDeleteLoading(true);
        setDeleteError('');
        try {
            await Promise.all(selectedRows.map((id) => deleteAsset(id)));
            await fetchAssets();
            setDeleteModalOpen(false);
        }
        catch (error) {
            console.error('Error deleting assets:', error);
            setDeleteError('Unable to delete selected assets. Please try again.');
        }
        finally {
            setDeleteLoading(false);
        }
    };
    const handleCancelDeleteSelected = () => {
        if (deleteLoading) {
            return;
        }
        setDeleteModalOpen(false);
        setDeleteError('');
    };
    if (mode !== 'list') {
        return (<AssetForm editing={editingAsset} mode={mode} products={products} productTypes={productTypes} vendors={vendors} assetStates={assetStates} selectedProductTypeId={selectedCategory} saving={saving} onBack={handleShowList} onSave={handleSaveAsset}/>);
    }
    return (<div>
      <div className="grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)]">
        <AssetTreePanel productTypes={productTypes} selectedCategory={selectedCategory} onSelectCategory={handleSelectCategory} loading={loadingProductTypes} error={productTypesError}/>

        <div className="space-y-5">
          <AssetToolbar selectedCount={selectedRows.length} showAddNew={Boolean(selectedCategory)} selectedProductTypeName={selectedProductTypeName} onAddNew={() => {
            setEditingAsset(null);
            setMode('create');
        }} onDeleteSelected={handleDeleteSelected} onClearFilters={() => {
            handleSelectCategory('');
        }} columns={assetColumns} visibleColumns={visibleAssetColumns} onVisibleColumnsChange={setVisibleAssetColumns}/>

          <AssetTable assets={assets} loading={loadingAssets} error={assetsError} selectedRows={selectedRows} onSelectedRowsChange={setSelectedRows} visibleColumns={visibleAssetColumns} onView={(asset) => {
            navigate(`/assets/${asset.id}`, { state: { asset } });
        }} onEdit={(asset) => {
            setEditingAsset(asset);
            setMode('edit');
        }}/>
        </div>
      </div>
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Selected Assets"
        message={deleteError || `Are you sure you want to delete ${selectedRows.length} selected asset${selectedRows.length > 1 ? 's' : ''}?`}
        itemName={selectedRows.length > 0 ? `${selectedRows.length} selected asset${selectedRows.length > 1 ? 's' : ''}` : ''}
        onConfirm={handleConfirmDeleteSelected}
        onCancel={handleCancelDeleteSelected}
        isLoading={deleteLoading}
      />
    </div>);
};
export default AssetsPage;

import axios from 'axios';
import { getToken, isTokenExpired, logout } from '../pages/users/auth/authStorage';

const DEFAULT_API_BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';
const API_BASE_URL = (process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
const apiUrl = (path) => `${API_BASE_URL}${path}`;

const PRODUCT_TYPES_API_BASE_URL = apiUrl('/api/product-types');
const PRODUCTS_API_BASE_URL = apiUrl('/api/products');
const VENDORS_API_BASE_URL = apiUrl('/api/vendors');
const SOFTWARE_TYPES_API_BASE_URL = apiUrl('/api/software-types');
const SOFTWARE_CATEGORIES_API_BASE_URL = apiUrl('/api/software-categories');
const MANUFACTURERS_API_BASE_URL = apiUrl('/api/manufacturers');
const SOFTWARE_LICENSE_TYPES_API_BASE_URL = apiUrl('/api/software-license-types');
const ASSET_STATES_API_BASE_URL = apiUrl('/api/asset-states');
const ASSETS_API_BASE_URL = apiUrl('/api/assets');
const AUTH_API_BASE_URL = apiUrl('/api/auth');
const USER_API_BASE_URL = apiUrl('/api/user');
const USERS_API_BASE_URL = apiUrl('/api/users');
const DEPARTMENTS_API_BASE_URL = apiUrl('/api/departments');
const DASHBOARD_API_BASE_URL = apiUrl('/api/dashboard');
const TASK_BOARDS_API_BASE_URL = apiUrl('/api/task-boards');
const TASK_LISTS_API_BASE_URL = apiUrl('/api/task-lists');
const TASK_CARDS_API_BASE_URL = apiUrl('/api/task-cards');

const isAuthEndpoint = (url = '') => String(url).includes('/api/auth/');
const isChangePasswordEndpoint = (url = '') => String(url).includes('/api/user/change-password');

axios.interceptors.request.use((config) => {
    if (isAuthEndpoint(config.url)) {
        return config;
    }

    const token = getToken();
    if (!token) {
        return config;
    }

    if (isTokenExpired()) {
        logout({ sessionExpired: true });
        window.location.replace('/login');
        return Promise.reject(new axios.CanceledError('Session expired'));
    }

    config.headers = config.headers || {};
    config.headers.Authorization = config.headers.Authorization || `Bearer ${token}`;
    return config;
});

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        const isCurrentPasswordError = isChangePasswordEndpoint(error.config?.url)
            && error.response?.data?.error === 'Current password is incorrect';
        if (error.response?.status === 401 && !isAuthEndpoint(error.config?.url) && !isCurrentPasswordError) {
            logout({ sessionExpired: true });
            window.location.replace('/login');
        }
        return Promise.reject(error);
    }
);

const getAuthConfig = () => {
    const token = getToken();
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

// API functions
export const getProductTypes = () => axios.get(PRODUCT_TYPES_API_BASE_URL);
export const getProductType = (id) => axios.get(`${PRODUCT_TYPES_API_BASE_URL}/${id}`);
export const createProductType = (data) => axios.post(PRODUCT_TYPES_API_BASE_URL, data);
export const updateProductType = (id, data) => axios.put(`${PRODUCT_TYPES_API_BASE_URL}/${id}`, data);
export const deleteProductType = (id) => axios.delete(`${PRODUCT_TYPES_API_BASE_URL}/${id}`);
// Software Type APIs
export const getSoftwareTypes = () => axios.get(SOFTWARE_TYPES_API_BASE_URL);
export const getSoftwareType = (id) => axios.get(`${SOFTWARE_TYPES_API_BASE_URL}/${id}`);
export const createSoftwareType = (data) => axios.post(SOFTWARE_TYPES_API_BASE_URL, data);
export const updateSoftwareType = (id, data) => axios.put(`${SOFTWARE_TYPES_API_BASE_URL}/${id}`, data);
export const deleteSoftwareType = (id) => axios.delete(`${SOFTWARE_TYPES_API_BASE_URL}/${id}`);
// Software Category APIs
export const getSoftwareCategories = () => axios.get(SOFTWARE_CATEGORIES_API_BASE_URL);
export const getSoftwareCategory = (id) => axios.get(`${SOFTWARE_CATEGORIES_API_BASE_URL}/${id}`);
export const createSoftwareCategory = (data) => axios.post(SOFTWARE_CATEGORIES_API_BASE_URL, data);
export const updateSoftwareCategory = (id, data) => axios.put(`${SOFTWARE_CATEGORIES_API_BASE_URL}/${id}`, data);
export const deleteSoftwareCategory = (id) => axios.delete(`${SOFTWARE_CATEGORIES_API_BASE_URL}/${id}`);
// Manufacturer APIs
export const getManufacturers = () => axios.get(MANUFACTURERS_API_BASE_URL);
export const getManufacturer = (id) => axios.get(`${MANUFACTURERS_API_BASE_URL}/${id}`);
export const createManufacturer = (data) => axios.post(MANUFACTURERS_API_BASE_URL, data);
export const updateManufacturer = (id, data) => axios.put(`${MANUFACTURERS_API_BASE_URL}/${id}`, data);
export const deleteManufacturer = (id) => axios.delete(`${MANUFACTURERS_API_BASE_URL}/${id}`);
// Software License Type APIs
export const getSoftwareLicenseTypes = () => axios.get(SOFTWARE_LICENSE_TYPES_API_BASE_URL);
export const getSoftwareLicenseType = (id) => axios.get(`${SOFTWARE_LICENSE_TYPES_API_BASE_URL}/${id}`);
export const createSoftwareLicenseType = (data) => axios.post(SOFTWARE_LICENSE_TYPES_API_BASE_URL, data);
export const updateSoftwareLicenseType = (id, data) => axios.put(`${SOFTWARE_LICENSE_TYPES_API_BASE_URL}/${id}`, data);
export const deleteSoftwareLicenseType = (id) => axios.delete(`${SOFTWARE_LICENSE_TYPES_API_BASE_URL}/${id}`);
// Asset State APIs
export const getAssetStates = () => axios.get(ASSET_STATES_API_BASE_URL);
export const getAssetState = (id) => axios.get(`${ASSET_STATES_API_BASE_URL}/${id}`);
export const createAssetState = (data) => axios.post(ASSET_STATES_API_BASE_URL, data);
export const updateAssetState = (id, data) => axios.put(`${ASSET_STATES_API_BASE_URL}/${id}`, data);
export const deleteAssetState = (id) => axios.delete(`${ASSET_STATES_API_BASE_URL}/${id}`);
// Asset APIs
export const getAssets = (productTypeId) => axios.get(ASSETS_API_BASE_URL, { params: productTypeId ? { product_type_id: productTypeId } : undefined });
export const getAsset = (id) => axios.get(`${ASSETS_API_BASE_URL}/${id}`);
export const createAsset = (data) => axios.post(ASSETS_API_BASE_URL, data);
export const updateAsset = (id, data) => axios.put(`${ASSETS_API_BASE_URL}/${id}`, data);
export const assignAsset = (id, data) => axios.post(`${ASSETS_API_BASE_URL}/${id}/assign`, data, getAuthConfig());
export const getAssetAssignmentHistory = (id) => axios.get(`${ASSETS_API_BASE_URL}/${id}/assignment-history`);
export const deleteAsset = (id) => axios.delete(`${ASSETS_API_BASE_URL}/${id}`);
// Auth APIs
export const signup = (data) => axios.post(`${AUTH_API_BASE_URL}/signup`, data);
export const login = (data) => axios.post(`${AUTH_API_BASE_URL}/login`, data);
export const forgotPassword = (data) => axios.post(`${AUTH_API_BASE_URL}/forgot-password`, data);
export const resetPassword = (data) => axios.post(`${AUTH_API_BASE_URL}/reset-password`, data);
export const getProfile = () => axios.get(`${USER_API_BASE_URL}/profile`, getAuthConfig());
export const getAssignableUsers = () => axios.get(`${USERS_API_BASE_URL}/assignable-users`, getAuthConfig());
export const getAdminUsers = (params) => axios.get(USERS_API_BASE_URL, { ...getAuthConfig(), params });
export const createAdminUser = (data) => axios.post(USERS_API_BASE_URL, data, getAuthConfig());
export const updateAdminUser = (id, data) => axios.put(`${USERS_API_BASE_URL}/${id}`, data, getAuthConfig());
export const deleteAdminUser = (id) => axios.delete(`${USERS_API_BASE_URL}/${id}`, getAuthConfig());
export const updateAdminUserRole = (id, data) => axios.put(`${USERS_API_BASE_URL}/${id}/role`, data, getAuthConfig());
export const getRoles = () => axios.get(apiUrl('/api/roles'), getAuthConfig());
export const getDepartments = () => axios.get(DEPARTMENTS_API_BASE_URL);
export const getDashboardStats = () => axios.get(`${DASHBOARD_API_BASE_URL}/stats`, getAuthConfig());
export const updateProfile = (data) => axios.put(`${USER_API_BASE_URL}/profile`, data, getAuthConfig());
export const changePassword = (data) => axios.put(`${USER_API_BASE_URL}/change-password`, data, getAuthConfig());
// Task Management APIs
export const getTaskBoards = () => axios.get(TASK_BOARDS_API_BASE_URL, getAuthConfig());
export const createTaskBoard = (data) => axios.post(TASK_BOARDS_API_BASE_URL, data, getAuthConfig());
export const getTaskBoardAccessStatus = (boardId) => axios.get(`${TASK_BOARDS_API_BASE_URL}/${boardId}/access-status`, getAuthConfig());
export const requestTaskBoardAccess = (boardId) => axios.post(`${TASK_BOARDS_API_BASE_URL}/${boardId}/request-access`, {}, getAuthConfig());
export const getTaskBoardLists = (boardId) => axios.get(`${TASK_BOARDS_API_BASE_URL}/${boardId}/lists`, getAuthConfig());
export const createTaskList = (data) => axios.post(TASK_LISTS_API_BASE_URL, data, getAuthConfig());
export const getTaskCards = (listId) => axios.get(`${TASK_LISTS_API_BASE_URL}/${listId}/cards`, getAuthConfig());
export const createTaskCard = (data) => axios.post(TASK_CARDS_API_BASE_URL, data, getAuthConfig());
export const moveTaskCard = (id, data) => axios.put(`${TASK_CARDS_API_BASE_URL}/${id}/move`, data, getAuthConfig());
export const reorderTaskCards = (data) => axios.put(`${TASK_CARDS_API_BASE_URL}/reorder`, data, getAuthConfig());
export const getBoardAccessRequests = () => axios.get(apiUrl('/api/admin/board-access-requests'), getAuthConfig());
export const approveBoardAccessRequest = (requestId, data = {}) => axios.put(apiUrl(`/api/admin/board-access-requests/${requestId}/approve`), data, getAuthConfig());
export const rejectBoardAccessRequest = (requestId, data = {}) => axios.put(apiUrl(`/api/admin/board-access-requests/${requestId}/reject`), data, getAuthConfig());
// Product APIs
export const getProducts = () => axios.get(PRODUCTS_API_BASE_URL);
export const getProduct = (id) => axios.get(`${PRODUCTS_API_BASE_URL}/${id}`);
export const createProduct = (data) => axios.post(PRODUCTS_API_BASE_URL, data);
export const updateProduct = (id, data) => axios.put(`${PRODUCTS_API_BASE_URL}/${id}`, data);
export const deleteProduct = (id) => axios.delete(`${PRODUCTS_API_BASE_URL}/${id}`);
// Vendor APIs
export const getVendors = () => axios.get(VENDORS_API_BASE_URL);
export const createVendor = (data) => axios.post(VENDORS_API_BASE_URL, data);
export const updateVendor = (id, data) => axios.put(`${VENDORS_API_BASE_URL}/${id}`, data);
export const deleteVendor = (id) => axios.delete(`${VENDORS_API_BASE_URL}/${id}`);

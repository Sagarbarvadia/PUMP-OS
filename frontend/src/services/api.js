import axios from 'axios';

const BASE =
  (process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000") + "/api";

const api = axios.create({ baseURL: BASE });



api.interceptors.request.use(config => {
  const token = localStorage.getItem("erp_token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Auth
export const authAPI = {
  me: () => api.get('/auth/me/'),
  users: () => api.get('/auth/users/'),
  createUser: data => api.post('/auth/users/', data),
  updateUser: (id, data) => api.put(`/auth/users/${id}/`, data),
  deleteUser: id => api.delete(`/auth/users/${id}/`),
  changePassword: data => api.post('/auth/change-password/', data),
};

// Master
export const masterAPI = {
  rawMaterials: params => api.get('/master/raw-materials/', { params }),
  createRawMaterial: data => api.post('/master/raw-materials/', data),
  updateRawMaterial: (id, data) => api.put(`/master/raw-materials/${id}/`, data),
  deleteRawMaterial: id => api.delete(`/master/raw-materials/${id}/`),
  products: params => api.get('/master/products/', { params }),
  createProduct: data => api.post('/master/products/', data),
  updateProduct: (id, data) => api.put(`/master/products/${id}/`, data),
  deleteProduct: id => api.delete(`/master/products/${id}/`),
};

// BOM
export const bomAPI = {
  list: params => api.get('/bom/', { params }),
  get: id => api.get(`/bom/${id}/`),
  create: data => api.post('/bom/', data),
  update: (id, data) => api.put(`/bom/${id}/`, data),

  import: (productModelId, file) => {
    const form = new FormData();
    form.append('product_model', productModelId);
    form.append('file', file);

    return api.post('/bom/import/', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  exportUrl: id => `${BASE}/bom/${id}/export/`,

  sampleDownload: () =>
    api.get('/bom/sample/', {
      responseType: 'blob'
    }),
};
// Inventory
export const inventoryAPI = {


  purchases: params => api.get('/inventory/purchases/', { params }),
  createPurchase: data => api.post('/inventory/purchases/', data),
  stock: () => api.get('/inventory/stock/'),
  ledger: itemId => api.get(`/inventory/ledger/${itemId}/`),

  adjustments: () => api.get('/inventory/adjustments/'),
  createAdjustment: data => api.post('/inventory/adjustments/', data),

  finishedGoods: () => api.get('/inventory/finished-goods/'),
  scrap: () => api.get('/inventory/scrap/'),

  reorderAlerts: () => api.get('/inventory/reorder-alerts/'),

  updatePurchase: (id, data) => api.put(`/inventory/purchases/${id}/`, data),
  deletePurchase: id => api.delete(`/inventory/purchases/${id}/`),

  importOpeningStock: file => {
  const form = new FormData();
  form.append('file', file);

  return api.post(
    "/inventory/opening-stock-import/",
    form,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
},

  sampleDownload: () =>
    api.get('/inventory/opening-stock-sample/', {
      responseType: 'blob'
    }),

  openingStockSampleUrl: () => `${BASE}/inventory/opening-stock-sample/`,
};

// Production
export const productionAPI = {
  orders: params => api.get('/production/orders/', { params }),
  getOrder: id => api.get(`/production/orders/${id}/`),
  createOrder: data => api.post('/production/orders/', data),
  today: () => api.get('/production/today/'),
};

// Dashboard
export const dashboardAPI = {
  get: () => api.get('/dashboard/'),
};

// Reports
export const reportsAPI = {
  rmStock: params => api.get('/reports/rm-stock/', { params }),
  finishedGoods: () => api.get('/reports/finished-goods/'),
  monthlyProduction: params => api.get('/reports/monthly-production/', { params }),
  dailyProduction: params => api.get('/reports/daily-production/', { params }),
  bomCost: params => api.get('/reports/bom-cost/', { params }),
  wastage: params => api.get('/reports/wastage/', { params }),
  reorder: () => api.get('/reports/reorder/'),
  stockMovement: params => api.get('/reports/stock-movement/', { params }),
};

export default api;

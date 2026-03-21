export const ADMIN_ROUTE_STORAGE_KEY = 'admin-route-authenticated';
export const ADMIN_ROUTE_AUTH_EVENT = 'admin-route-auth-changed';

export const ADMIN_ROUTE_ID = import.meta.env.VITE_ADMIN_ROUTE_ID;

export const ADMIN_ROUTE_PASSWORD = import.meta.env.VITE_ADMIN_ROUTE_PASSWORD;

export const isAdminRouteAuthenticated = () => localStorage.getItem(ADMIN_ROUTE_STORAGE_KEY) === 'true';

export const setAdminRouteAuthenticated = () => {
  localStorage.setItem(ADMIN_ROUTE_STORAGE_KEY, 'true');
  window.dispatchEvent(new Event(ADMIN_ROUTE_AUTH_EVENT));
};

export const clearAdminRouteAuthenticated = () => {
  localStorage.removeItem(ADMIN_ROUTE_STORAGE_KEY);
  window.dispatchEvent(new Event(ADMIN_ROUTE_AUTH_EVENT));
};

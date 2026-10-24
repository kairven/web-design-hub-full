import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../lib/api.js';
import { storage } from '../lib/storage.js';
import { ApiError } from '../lib/api.js';

const AuthContext = createContext(null);
const USER_KEY = 'zayka.user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => storage.getJSON(USER_KEY));
  const [addresses, setAddresses] = useState([]);
  const [booting, setBooting] = useState(!!getToken());

  const persist = useCallback((nextUser) => {
    setUser(nextUser);
    if (nextUser) storage.setJSON(USER_KEY, nextUser);
    else storage.remove(USER_KEY);
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setBooting(false);
      persist(null);
      return null;
    }
    try {
      const data = await api('/auth/me');
      persist(data.user);
      setAddresses(data.addresses);
      return data.user;
    } catch (err) {
      // Keep the local session on transient failures (offline, 5xx, aborted
      // requests). Only a real 401 forces a sign-out.
      if (err instanceof ApiError && err.status === 401) {
        persist(null);
        setToken('');
      }
      return null;
    } finally {
      setBooting(false);
    }
  }, [persist]);

  useEffect(() => { refresh(); }, [refresh]);

  // A 401 fired by any request (e.g. token expired mid-checkout) drops the
  // session exactly once and tells the UI, instead of looping silently.
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setAddresses([]);
    };
    window.addEventListener('zayka:session-expired', onExpired);
    return () => window.removeEventListener('zayka:session-expired', onExpired);
  }, []);

  const login = useCallback(async (identifier, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { identifier, password } });
    setToken(data.token);
    persist(data.user);
    await refresh();
    return data.user;
  }, [persist, refresh]);

  const register = useCallback(async (payload) => {
    const data = await api('/auth/register', { method: 'POST', body: payload });
    setToken(data.token);
    persist(data.user);
    await refresh();
    return data.user;
  }, [persist, refresh]);

  const logout = useCallback(() => {
    setToken('');
    persist(null);
    setAddresses([]);
  }, [persist]);

  const updateProfile = useCallback(async (payload) => {
    const data = await api('/auth/me', { method: 'PATCH', body: payload });
    persist(data.user);
    return data.user;
  }, [persist]);

  const addAddress = useCallback(async (payload) => {
    const data = await api('/addresses', { method: 'POST', body: payload });
    setAddresses((prev) => [data.address, ...(data.address.is_default ? prev.map((a) => ({ ...a, is_default: 0 })) : prev)]);
    return data.address;
  }, []);

  const updateAddress = useCallback(async (id, payload) => {
    const data = await api(`/addresses/${id}`, { method: 'PATCH', body: payload });
    setAddresses((prev) =>
      prev.map((a) => (a.id === data.address.id ? data.address : payload.isDefault ? { ...a, is_default: 0 } : a))
    );
    return data.address;
  }, []);

  const deleteAddress = useCallback(async (id) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    try {
      await api(`/addresses/${id}`, { method: 'DELETE' });
    } catch (err) {
      await refresh();
      throw err;
    }
  }, [refresh]);

  const value = useMemo(
    () => ({
      user, addresses, booting, isAdmin: user?.role === 'admin' || user?.role === 'staff',
      login, register, logout, refresh, updateProfile, addAddress, updateAddress, deleteAddress, setAddresses,
    }),
    [user, addresses, booting, login, register, logout, refresh, updateProfile, addAddress, updateAddress, deleteAddress]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

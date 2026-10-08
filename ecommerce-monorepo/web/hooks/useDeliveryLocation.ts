'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/components/SettingsProvider';
import { UserAddressOption } from '@/app/[locale]/design-3/components/LocationModal';

export const DELIVERY_LOCATION_KEY = 'delivery_location';
export const DELIVERY_LOCATION_CUSTOM_SET_KEY = 'delivery_location_user_selected';
export const DELIVERY_SAVED_ADDRESSES_KEY = 'delivery_saved_addresses';

export function useDeliveryLocation() {
  const { isAuthenticated, isInitialized } = useAuth();
  const { settings } = useSettings();

  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    settings?.companyAddress || 'Worldwide Shipping'
  );
  const [dbAddresses, setDbAddresses] = useState<UserAddressOption[]>([]);
  const [localSavedAddresses, setLocalSavedAddresses] = useState<UserAddressOption[]>([]);
  const [isGeoLoading, setIsGeoLoading] = useState<boolean>(false);

  // Helper to load local saved addresses from localStorage
  const loadLocalSavedAddresses = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(DELIVERY_SAVED_ADDRESSES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setLocalSavedAddresses(parsed);
          return;
        }
      }
    } catch {}
    setLocalSavedAddresses([]);
  }, []);

  // Helper to persist user's manual address selection (with full option item for saved list)
  const saveDeliveryAddress = useCallback((addr: string, details?: Partial<UserAddressOption>) => {
    if (!addr) return;
    const trimmed = addr.trim();
    if (!trimmed) return;

    // 1. Set active delivery address string
    setDeliveryAddress(trimmed);
    try {
      localStorage.setItem(DELIVERY_LOCATION_KEY, trimmed);
      localStorage.setItem(DELIVERY_LOCATION_CUSTOM_SET_KEY, 'true');
      window.dispatchEvent(new CustomEvent('delivery-location-updated', { detail: trimmed }));
    } catch {}

    // 2. Parse or construct address option
    const newOption: UserAddressOption = {
      id: details?.id || `local-${Date.now()}`,
      city: details?.city || trimmed.split(',')[0]?.trim() || trimmed,
      country: details?.country || (trimmed.split(',')[1]?.trim() || ''),
      addressLine1: details?.addressLine1 || trimmed,
      isDefault: details?.isDefault || false,
      label: details?.label || null,
    };

    // 3. Persist in saved addresses list
    try {
      let currentList: UserAddressOption[] = [];
      const stored = localStorage.getItem(DELIVERY_SAVED_ADDRESSES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) currentList = parsed;
      }

      const filtered = currentList.filter(
        (item) =>
          item.addressLine1.toLowerCase().trim() !== newOption.addressLine1.toLowerCase().trim() &&
          `${item.city}, ${item.country}`.toLowerCase().trim() !== `${newOption.city}, ${newOption.country}`.toLowerCase().trim()
      );

      const updated = [newOption, ...filtered].slice(0, 10);
      localStorage.setItem(DELIVERY_SAVED_ADDRESSES_KEY, JSON.stringify(updated));
      setLocalSavedAddresses(updated);
      window.dispatchEvent(new CustomEvent('delivery-saved-addresses-updated', { detail: updated }));
    } catch (err) {
      console.warn('Failed to persist saved delivery address:', err);
    }
  }, []);

  const removeSavedDeliveryAddress = useCallback((id: string) => {
    try {
      let currentList: UserAddressOption[] = [];
      const stored = localStorage.getItem(DELIVERY_SAVED_ADDRESSES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) currentList = parsed;
      }
      const updated = currentList.filter((item) => item.id !== id);
      localStorage.setItem(DELIVERY_SAVED_ADDRESSES_KEY, JSON.stringify(updated));
      setLocalSavedAddresses(updated);
      window.dispatchEvent(new CustomEvent('delivery-saved-addresses-updated', { detail: updated }));
    } catch {}
  }, []);

  const setCustomDeliveryAddress = useCallback((addr: string) => {
    saveDeliveryAddress(addr);
  }, [saveDeliveryAddress]);

  // Fetch logged in user's saved addresses
  const fetchUserAddresses = useCallback(async () => {
    if (!isAuthenticated || !isInitialized) {
      setDbAddresses([]);
      return;
    }
    try {
      const res = await fetch('/api/addresses', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      const addrs: UserAddressOption[] = (data.data || []).map((a: any) => ({
        id: a.id,
        city: a.city,
        country: a.country,
        addressLine1: a.addressLine1,
        isDefault: a.isDefault,
        label: a.label ?? null,
      }));
      setDbAddresses(addrs);

      // If user has a default address, prioritize it unless user explicitly picked a custom one
      const isCustomSet = (() => {
        try {
          return localStorage.getItem(DELIVERY_LOCATION_CUSTOM_SET_KEY) === 'true';
        } catch {
          return false;
        }
      })();

      if (!isCustomSet && addrs.length > 0) {
        const defaultAddr = addrs.find((a) => a.isDefault) ?? addrs[0];
        const locStr = [defaultAddr.city, defaultAddr.country].filter(Boolean).join(', ');
        if (locStr) {
          setDeliveryAddress(locStr);
          try {
            localStorage.setItem(DELIVERY_LOCATION_KEY, locStr);
          } catch {}
        }
      }
    } catch (err) {
      console.error('Failed to fetch user addresses:', err);
    }
  }, [isAuthenticated, isInitialized]);

  // Combined list of addresses: DB addresses followed by local saved ones (deduped)
  const userAddresses: UserAddressOption[] = useMemo(() => {
    const list: UserAddressOption[] = [...dbAddresses];
    const seen = new Set(
      dbAddresses.map((a) => `${a.city}|${a.country}|${a.addressLine1}`.toLowerCase().trim())
    );

    for (const localAddr of localSavedAddresses) {
      const key = `${localAddr.city}|${localAddr.country}|${localAddr.addressLine1}`.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        list.push(localAddr);
      }
    }

    return list;
  }, [dbAddresses, localSavedAddresses]);

  // Initial load effect (Local storage -> IP location resolution)
  useEffect(() => {
    let isMounted = true;

    const initLocation = async () => {
      let savedLocation: string | null = null;
      let isExplicitlySet = false;

      try {
        savedLocation = localStorage.getItem(DELIVERY_LOCATION_KEY);
        isExplicitlySet = localStorage.getItem(DELIVERY_LOCATION_CUSTOM_SET_KEY) === 'true';
      } catch {}

      // If user already manually selected an address, honor it immediately
      if (savedLocation && isExplicitlySet) {
        if (isMounted) setDeliveryAddress(savedLocation);
        return;
      }

      // If saved location exists and is a valid specific place, keep it as initial state
      if (savedLocation && savedLocation !== 'Worldwide Shipping' && savedLocation !== settings?.companyAddress) {
        if (isMounted) setDeliveryAddress(savedLocation);
      }

      // If not explicitly set by the user, query IP geolocation for a real default location
      if (!isExplicitlySet) {
        setIsGeoLoading(true);
        try {
          const res = await fetch('/api/geo/ip');
          if (res.ok) {
            const data = await res.json();
            if (isMounted && data.success && data.formatted && data.formatted !== 'Worldwide Shipping') {
              setDeliveryAddress(data.formatted);
              try {
                localStorage.setItem(DELIVERY_LOCATION_KEY, data.formatted);
              } catch {}
            }
          }
        } catch (err) {
          console.warn('IP location detection failed:', err);
        } finally {
          if (isMounted) setIsGeoLoading(false);
        }
      }
    };

    initLocation();
    loadLocalSavedAddresses();

    // Listen to cross-component sync events
    const handleUpdate = (e: any) => {
      if (e?.detail && typeof e.detail === 'string') {
        setDeliveryAddress(e.detail);
      }
    };

    const handleSavedAddressesUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail)) {
        setLocalSavedAddresses(e.detail);
      } else {
        loadLocalSavedAddresses();
      }
    };

    window.addEventListener('delivery-location-updated', handleUpdate);
    window.addEventListener('delivery-saved-addresses-updated', handleSavedAddressesUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === DELIVERY_LOCATION_KEY && e.newValue) {
        setDeliveryAddress(e.newValue);
      }
      if (e.key === DELIVERY_SAVED_ADDRESSES_KEY) {
        loadLocalSavedAddresses();
      }
    });

    return () => {
      isMounted = false;
      window.removeEventListener('delivery-location-updated', handleUpdate);
      window.removeEventListener('delivery-saved-addresses-updated', handleSavedAddressesUpdate);
    };
  }, [settings?.companyAddress, loadLocalSavedAddresses]);

  useEffect(() => {
    fetchUserAddresses();
  }, [fetchUserAddresses]);

  useEffect(() => {
    const handler = () => fetchUserAddresses();
    window.addEventListener('addresses-updated', handler);
    return () => window.removeEventListener('addresses-updated', handler);
  }, [fetchUserAddresses]);

  return {
    deliveryAddress,
    setDeliveryAddress: setCustomDeliveryAddress,
    saveDeliveryAddress,
    removeSavedDeliveryAddress,
    userAddresses,
    isGeoLoading,
    refreshAddresses: fetchUserAddresses,
  };
}

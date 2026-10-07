'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/components/SettingsProvider';
import { UserAddressOption } from '@/app/[locale]/design-3/components/LocationModal';

export const DELIVERY_LOCATION_KEY = 'delivery_location';
export const DELIVERY_LOCATION_CUSTOM_SET_KEY = 'delivery_location_user_selected';

export function useDeliveryLocation() {
  const { isAuthenticated, isInitialized } = useAuth();
  const { settings } = useSettings();

  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    settings?.companyAddress || 'Worldwide Shipping'
  );
  const [userAddresses, setUserAddresses] = useState<UserAddressOption[]>([]);
  const [isGeoLoading, setIsGeoLoading] = useState<boolean>(false);

  // Helper to persist user's manual address selection
  const setCustomDeliveryAddress = useCallback((addr: string) => {
    if (!addr) return;
    const trimmed = addr.trim();
    setDeliveryAddress(trimmed);
    try {
      localStorage.setItem(DELIVERY_LOCATION_KEY, trimmed);
      localStorage.setItem(DELIVERY_LOCATION_CUSTOM_SET_KEY, 'true');
      window.dispatchEvent(new CustomEvent('delivery-location-updated', { detail: trimmed }));
    } catch {}
  }, []);

  // Fetch logged in user's saved addresses
  const fetchUserAddresses = useCallback(async () => {
    if (!isAuthenticated || !isInitialized) {
      setUserAddresses([]);
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
      setUserAddresses(addrs);

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

    // Listen to cross-component sync events
    const handleUpdate = (e: any) => {
      if (e?.detail && typeof e.detail === 'string') {
        setDeliveryAddress(e.detail);
      }
    };
    window.addEventListener('delivery-location-updated', handleUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === DELIVERY_LOCATION_KEY && e.newValue) {
        setDeliveryAddress(e.newValue);
      }
    });

    return () => {
      isMounted = false;
      window.removeEventListener('delivery-location-updated', handleUpdate);
    };
  }, [settings?.companyAddress]);

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
    userAddresses,
    isGeoLoading,
    refreshAddresses: fetchUserAddresses,
  };
}

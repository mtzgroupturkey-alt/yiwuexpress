'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  MapPin, 
  Search, 
  Navigation, 
  Loader2, 
  Check, 
  Building, 
  Layers, 
  CornerDownRight, 
  ChevronDown, 
  AlertCircle,
  Lock,
  Compass,
  ShieldAlert,
  ExternalLink
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { useSettings } from '@/components/SettingsProvider';
import {
  isCoordinateAddress,
  getOfflineLocationName,
  resolveCoordinatesClientSide,
  searchOfflineCities,
} from '@/lib/geo/coordinateResolver';

export interface StructuredAddress {
  formattedAddress: string;
  country: string;
  countryCode?: string;
  city: string;
  state?: string;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  lat: number;
  lng: number;
  // Manual completion fields
  apartment?: string;
  entrance?: string;
  floor?: string;
  notes?: string;
}

export interface SearchResultItem {
  id: string;
  label: string;
  city?: string;
  country?: string;
  lat: number;
  lng: number;
}

export interface AddressMapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (address: StructuredAddress) => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  locale?: string;
  provider?: 'yandex' | 'leaflet';
}

// Sensible default coordinates based on locale / country
const DEFAULT_COORDS = {
  minsk: { lat: 53.9006, lng: 27.5590 },  // Belarus
  moscow: { lat: 55.7558, lng: 37.6173 }, // Russia
  yiwu: { lat: 29.3069, lng: 120.0754 },  // China
};

export function AddressMapPicker({
  isOpen,
  onClose,
  onConfirm,
  initialLat,
  initialLng,
  initialAddress,
  locale: propLocale,
  provider: propProvider,
}: AddressMapPickerProps) {
  const currentLocale = useLocale() || propLocale || 'ru';
  const { settings } = useSettings();
  const configuredProvider = propProvider || (settings?.mapProvider as 'yandex' | 'leaflet') || 'yandex';
  const customYandexApiKey = settings?.yandexMapsApiKey?.trim() || '';
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Picked coordinates & structured address state
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(() => {
    if (initialLat && initialLng) return { lat: initialLat, lng: initialLng };
    if (currentLocale === 'zh') return DEFAULT_COORDS.yiwu;
    return DEFAULT_COORDS.moscow;
  });

  const [addressDetails, setAddressDetails] = useState<Partial<StructuredAddress>>({
    formattedAddress: initialAddress || '',
  });

  // Manual additional fields
  const [apartment, setApartment] = useState('');
  const [entrance, setEntrance] = useState('');
  const [floor, setFloor] = useState('');
  const [notes, setNotes] = useState('');
  const [showManualFields, setShowManualFields] = useState(false);

  // UI state
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeProvider, setActiveProvider] = useState<'yandex' | 'leaflet' | 'loading'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // References to active map instances
  const ymapsMapRef = useRef<any>(null);
  const ymapsPlacemarkRef = useRef<any>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletMarkerRef = useRef<any>(null);

  // 1. Determine Initial Center (from IP if available)
  useEffect(() => {
    if (!isOpen) return;

    if (!initialLat && !initialLng) {
      // Query fast IP geo to find user's approximate city
      fetch('/api/geo/ip')
        .then((res) => res.json())
        .then((data) => {
          if (data?.success) {
            if (data.countryCode === 'BY') {
              setCoords(DEFAULT_COORDS.minsk);
            } else if (data.countryCode === 'RU') {
              setCoords(DEFAULT_COORDS.moscow);
            } else if (data.countryCode === 'CN') {
              setCoords(DEFAULT_COORDS.yiwu);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, initialLat, initialLng]);

  // 2. Reverse Geocoding Helper
  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      setIsGeocoding(true);
      setErrorMsg(null);
      try {
        const res = await fetch(
          `/api/geo/reverse?lat=${lat}&lng=${lng}&locale=${encodeURIComponent(currentLocale)}`
        );
        const data = await res.json();
        if (
          data.success &&
          data.address &&
          (data.address.city || data.address.country) &&
          !isCoordinateAddress(data.address.city)
        ) {
          setAddressDetails(data.address);
          setIsGeocoding(false);
          return;
        }
      } catch (err) {
        console.warn('API reverse geocode failed, trying client fallback:', err);
      }

      // Client-side fallback if server API is unavailable/failed
      try {
        const clientResolved = await resolveCoordinatesClientSide(lat, lng, currentLocale);
        if (clientResolved && (clientResolved.city || clientResolved.country)) {
          setAddressDetails((prev) => ({
            ...prev,
            lat,
            lng,
            city: clientResolved.city,
            country: clientResolved.country,
            countryCode: clientResolved.countryCode,
            formattedAddress: clientResolved.formattedAddress,
            street: prev.street || clientResolved.street,
          }));
          setIsGeocoding(false);
          return;
        }
      } catch (clientErr) {
        console.warn('Client fallback geocode failed, using offline lookup:', clientErr);
      }

      // Guaranteed offline geometric lookup (never outputs raw float coords)
      const offline = getOfflineLocationName(lat, lng, currentLocale);
      setAddressDetails((prev) => ({
        ...prev,
        lat,
        lng,
        city: offline.city,
        country: offline.country,
        countryCode: offline.countryCode,
        formattedAddress: offline.formattedAddress,
      }));
      setIsGeocoding(false);
    },
    [currentLocale]
  );

  // 3. Initialize Yandex or Fallback Leaflet Map
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    const initLeaflet = async () => {
      if (isCancelled) return;
      setActiveProvider('leaflet');

      // Inject Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Inject Leaflet JS if not loaded
      if (!(window as any).L) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Leaflet'));
          document.head.appendChild(script);
        });
      }

      if (isCancelled || !mapContainerRef.current) return;
      const L = (window as any).L;

      // Clean old instance if any
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 15,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Custom marker icon
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="transform: translate(-50%, -100%);">
          <div style="background-color: #00407a; color: white; padding: 6px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(0,64,122,0.4); border: 2px solid white; display: flex; align-items: center; justify-content: center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([coords.lat, coords.lng], {
        draggable: true,
        icon: customIcon,
      }).addTo(map);

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setCoords({ lat: position.lat, lng: position.lng });
        reverseGeocode(position.lat, position.lng);
      });

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });

      leafletMapRef.current = map;
      leafletMarkerRef.current = marker;

      // Initial reverse geocode
      reverseGeocode(coords.lat, coords.lng);
    };

    const initYandex = async () => {
      setActiveProvider('loading');
      const yandexApiKey = customYandexApiKey || process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY || '';
      const yLang = currentLocale === 'zh' ? 'en_US' : currentLocale === 'en' ? 'en_US' : 'ru_RU';

      // Load Yandex Maps script
      if (!(window as any).ymaps) {
        try {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://api-maps.yandex.ru/2.1/?lang=${yLang}${yandexApiKey ? `&apikey=${yandexApiKey}` : ''}`;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Yandex script failed'));
            document.head.appendChild(script);

            // Timeout after 4 seconds to fallback to Leaflet
            setTimeout(() => {
              if (!(window as any).ymaps) reject(new Error('Yandex script timeout'));
            }, 4000);
          });
        } catch (err) {
          console.warn('Yandex load failed, activating Leaflet fallback:', err);
          return initLeaflet();
        }
      }

      if (isCancelled || !mapContainerRef.current) return;
      const ymaps = (window as any).ymaps;

      ymaps.ready(() => {
        if (isCancelled || !mapContainerRef.current) return;

        try {
          if (ymapsMapRef.current) {
            ymapsMapRef.current.destroy();
            ymapsMapRef.current = null;
          }

          const map = new ymaps.Map(mapContainerRef.current, {
            center: [coords.lat, coords.lng],
            zoom: 15,
            controls: ['zoomControl', 'geolocationControl'],
          });

          const placemark = new ymaps.Placemark(
            [coords.lat, coords.lng],
            { hintContent: 'Delivery Location' },
            {
              draggable: true,
              preset: 'islands#nightDotIconWithCaption',
              iconColor: '#00407a',
            }
          );

          placemark.events.add('dragend', () => {
            const position = placemark.geometry.getCoordinates();
            setCoords({ lat: position[0], lng: position[1] });
            reverseGeocode(position[0], position[1]);
          });

          map.events.add('click', (e: any) => {
            const coordsClicked = e.get('coords');
            placemark.geometry.setCoordinates(coordsClicked);
            setCoords({ lat: coordsClicked[0], lng: coordsClicked[1] });
            reverseGeocode(coordsClicked[0], coordsClicked[1]);
          });

          map.geoObjects.add(placemark);

          ymapsMapRef.current = map;
          ymapsPlacemarkRef.current = placemark;
          setActiveProvider('yandex');

          reverseGeocode(coords.lat, coords.lng);
        } catch (initErr) {
          console.warn('Yandex map instance failed, switching to Leaflet:', initErr);
          initLeaflet();
        }
      });
    };

    // Route initialization based on configured provider (from admin setting or prop)
    if (configuredProvider === 'leaflet') {
      initLeaflet();
    } else {
      initYandex();
    }

    return () => {
      isCancelled = true;
      if (ymapsMapRef.current) {
        try {
          ymapsMapRef.current.destroy();
        } catch {}
        ymapsMapRef.current = null;
      }
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
        } catch {}
        leafletMapRef.current = null;
      }
    };
  }, [isOpen, configuredProvider, customYandexApiKey, currentLocale, reverseGeocode]);

  // 4. Reposition Map and Placemark when coords change via search or GPS
  const moveMapTo = useCallback((lat: number, lng: number) => {
    setCoords({ lat, lng });

    if (activeProvider === 'yandex' && ymapsMapRef.current && ymapsPlacemarkRef.current) {
      ymapsMapRef.current.setCenter([lat, lng], 16, { checkZoomRange: true, duration: 300 });
      ymapsPlacemarkRef.current.geometry.setCoordinates([lat, lng]);
    } else if (activeProvider === 'leaflet' && leafletMapRef.current && leafletMarkerRef.current) {
      leafletMapRef.current.setView([lat, lng], 16);
      leafletMarkerRef.current.setLatLng([lat, lng]);
    }

    reverseGeocode(lat, lng);
  }, [activeProvider, reverseGeocode]);

  // 5. GPS / IP Geolocation Handler with Explicit Permission & Fallback Support
  const handleLocateMe = async () => {
    setErrorMsg(null);
    setIsLocating(true);
    setIsGeocoding(true);

    const tryIpGeoFallback = async () => {
      try {
        const res = await fetch('/api/geo/ip');
        if (res.ok) {
          const data = await res.json();
          if (data?.success && typeof data.lat === 'number' && typeof data.lng === 'number' && !isNaN(data.lat) && !isNaN(data.lng)) {
            moveMapTo(data.lat, data.lng);
            setIsGeocoding(false);
            setIsLocating(false);
            return true;
          }
        }
      } catch (ipErr) {
        console.warn('IP geolocation fallback failed:', ipErr);
      }
      return false;
    };

    const tryYmapsGeoFallback = async () => {
      if ((window as any).ymaps?.geolocation?.get) {
        try {
          const ymaps = (window as any).ymaps;
          const res = await ymaps.geolocation.get({
            provider: 'auto',
            autoReverseGeocode: false,
            timeout: 6000,
          });
          const geoObj = res.geoObjects.get(0);
          if (geoObj) {
            const [yLat, yLng] = geoObj.geometry.getCoordinates();
            if (typeof yLat === 'number' && typeof yLng === 'number') {
              moveMapTo(yLat, yLng);
              setIsGeocoding(false);
              setIsLocating(false);
              return true;
            }
          }
        } catch (yErr) {
          console.warn('Yandex geolocation fallback failed:', yErr);
        }
      }
      return false;
    };

    // If browser supports navigator.permissions, check state upfront
    if (typeof navigator !== 'undefined' && 'permissions' in navigator && navigator.permissions?.query) {
      try {
        const permStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (permStatus.state === 'denied') {
          // Explicitly denied by user in browser settings
          setShowPermissionHelp(true);
          // Still provide instant location via IP or Ymaps so user gets their city
          const fallbackSuccess = (await tryYmapsGeoFallback()) || (await tryIpGeoFallback());
          setIsLocating(false);
          setIsGeocoding(false);
          if (!fallbackSuccess) {
            setErrorMsg(
              currentLocale === 'ru'
                ? 'Доступ к местоположению заблокирован в браузере'
                : currentLocale === 'zh'
                ? '浏览器已禁止位置访问权限'
                : 'Location permission blocked in your browser'
            );
          }
          return;
        }
      } catch (pErr) {
        // Some browsers don't support geolocation permission query, proceed normally
      }
    }

    // Call browser HTML5 Geolocation API (triggers native browser permission prompt if not yet decided)
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setShowPermissionHelp(false);
          moveMapTo(latitude, longitude);
          setIsLocating(false);
        },
        async (err) => {
          console.warn('HTML5 Geolocation error:', err);
          setIsLocating(false);

          if (err.code === 1) {
            // PERMISSION_DENIED: User clicked "Block" or denied permission
            setShowPermissionHelp(true);
            const fallbackOk = (await tryYmapsGeoFallback()) || (await tryIpGeoFallback());
            setIsGeocoding(false);
            if (!fallbackOk) {
              setErrorMsg(
                currentLocale === 'ru'
                  ? 'Доступ к геопозиции заблокирован. Разрешите доступ в настройках браузера.'
                  : currentLocale === 'zh'
                  ? '位置访问已被拒绝，请在浏览器地址栏允许定位。'
                  : 'Location access was denied. Please allow location in your browser.'
              );
            }
            return;
          }

          // Code 2 (POSITION_UNAVAILABLE) or Code 3 (TIMEOUT): Try high-accuracy fallback or IP
          const ymapsSuccess = await tryYmapsGeoFallback();
          if (ymapsSuccess) return;

          const ipSuccess = await tryIpGeoFallback();
          if (ipSuccess) return;

          setIsGeocoding(false);
          setErrorMsg(
            currentLocale === 'ru' 
              ? 'Не удалось определить точную геопозицию. Проверьте интернет или выберите точку на карте.' 
              : currentLocale === 'zh'
              ? '无法精确定位，请检查网络或在地图上手动选择。'
              : 'Unable to pinpoint exact location. Please select on map.'
          );
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
      return;
    }

    // Geolocation not supported in navigator: fallback directly to Yandex / IP
    const ymapsSuccess = await tryYmapsGeoFallback();
    if (ymapsSuccess) return;

    const ipSuccess = await tryIpGeoFallback();
    if (ipSuccess) return;

    setIsLocating(false);
    setIsGeocoding(false);
    setErrorMsg(
      currentLocale === 'ru' 
        ? 'Геолокация не поддерживается вашим браузером' 
        : currentLocale === 'zh'
        ? '您的浏览器不支持地理定位'
        : 'Geolocation is not supported by your browser'
    );
  };

  // 6. Search Autocomplete Debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        let results: SearchResultItem[] = [];

        // 1. Fetch from multi-tier server API (Photon + Yandex + OSM + offline dictionary)
        try {
          const res = await fetch(
            `/api/geo/search?q=${encodeURIComponent(searchQuery)}&locale=${encodeURIComponent(currentLocale)}`
          );
          const data = await res.json();
          if (data?.success && Array.isArray(data.results) && data.results.length > 0) {
            results = data.results;
          }
        } catch (fetchErr) {
          console.warn('Server geo search API request failed:', fetchErr);
        }

        // 2. Client-side Yandex Suggest fallback if server returned 0 results and ymaps is available in browser
        if (results.length === 0 && (window as any).ymaps?.suggest) {
          try {
            const ymaps = (window as any).ymaps;
            const suggestions = await ymaps.suggest(searchQuery, { results: 5 });
            if (suggestions && suggestions.length > 0) {
              results = suggestions.map((s: any, idx: number) => ({
                id: `ymaps-client-${idx}-${Date.now()}`,
                label: s.displayName,
                city: s.value,
                lat: 0,
                lng: 0,
              }));
            }
          } catch (suggestErr) {
            console.warn('Client ymaps.suggest failed:', suggestErr);
          }
        }

        // 3. Client-side offline city directory fallback if still empty
        if (results.length === 0) {
          const offlineCities = searchOfflineCities(searchQuery, currentLocale);
          if (offlineCities.length > 0) {
            results = offlineCities;
          }
        }

        setSearchResults(results);
        setShowSearchResults(results.length > 0);
      } catch (err) {
        console.error('Search query error:', err);
        const offlineCities = searchOfflineCities(searchQuery, currentLocale);
        if (offlineCities.length > 0) {
          setSearchResults(offlineCities);
          setShowSearchResults(true);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, currentLocale]);

  // 7. Confirm Address
  const handleConfirm = () => {
    if (!coords.lat || !coords.lng) return;

    // Combine manual fields into full formatted line if needed
    const parts: string[] = [];
    if (addressDetails.street) {
      parts.push(addressDetails.houseNumber ? `${addressDetails.street}, ${addressDetails.houseNumber}` : addressDetails.street);
    }
    if (apartment) parts.push(currentLocale === 'ru' ? `кв. ${apartment}` : `Apt ${apartment}`);
    if (addressDetails.city && !isCoordinateAddress(addressDetails.city)) parts.push(addressDetails.city);
    if (addressDetails.country && !isCoordinateAddress(addressDetails.country)) parts.push(addressDetails.country);

    let finalFormatted = parts.length > 0 ? parts.join(', ') : (addressDetails.formattedAddress || '');
    let resolvedCity = addressDetails.city && !isCoordinateAddress(addressDetails.city) ? addressDetails.city : '';
    let resolvedCountry = addressDetails.country && !isCoordinateAddress(addressDetails.country) ? addressDetails.country : '';
    let resolvedCountryCode = addressDetails.countryCode || '';

    // If city or formatted line is still empty or looks like numbers, apply offline resolver
    if (!resolvedCity || isCoordinateAddress(resolvedCity) || !finalFormatted || isCoordinateAddress(finalFormatted)) {
      const offline = getOfflineLocationName(coords.lat, coords.lng, currentLocale);
      resolvedCity = resolvedCity || offline.city;
      resolvedCountry = resolvedCountry || offline.country;
      resolvedCountryCode = resolvedCountryCode || offline.countryCode;
      if (!finalFormatted || isCoordinateAddress(finalFormatted)) {
        finalFormatted = parts.length > 0 ? [...parts, resolvedCity, resolvedCountry].join(', ') : offline.formattedAddress;
      }
    }

    const structured: StructuredAddress = {
      formattedAddress: finalFormatted,
      country: resolvedCountry || (currentLocale === 'ru' ? 'Россия' : 'Russia'),
      countryCode: resolvedCountryCode || 'RU',
      city: resolvedCity || resolvedCountry,
      state: addressDetails.state,
      street: addressDetails.street,
      houseNumber: addressDetails.houseNumber,
      postalCode: addressDetails.postalCode,
      lat: coords.lat,
      lng: coords.lng,
      apartment: apartment || undefined,
      entrance: entrance || undefined,
      floor: floor || undefined,
      notes: notes || undefined,
    };

    onConfirm(structured);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Main Dialog / Mobile Bottom Sheet */}
      <div className="relative w-full h-full sm:h-[700px] sm:max-h-[92vh] max-w-4xl bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10">
        
        {/* Top Header */}
        <div className="px-4 py-3 bg-[#F8FAFC] border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#00407a] flex items-center justify-center border border-blue-100">
              <MapPin className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                {currentLocale === 'zh'
                  ? '在地图上选择送达地址'
                  : currentLocale === 'ru'
                  ? 'Выбрать адрес доставки на карте'
                  : 'Select Delivery Address on Map'}
              </h3>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {currentLocale === 'zh'
                  ? '拖动图钉或点击地图准确定位您的收货地点'
                  : currentLocale === 'ru'
                  ? 'Перемещайте метку или нажмите на карту для точного адреса'
                  : 'Drag pin or click map to pinpoint your exact delivery location'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
            aria-label="Close map"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar Overlay */}
        <div className="p-3 bg-white border-b border-slate-100 relative z-40 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                placeholder={
                  currentLocale === 'zh'
                    ? '输入城市、街道、门牌号快速搜索...'
                    : currentLocale === 'ru'
                    ? 'Поиск города, улицы или номера дома...'
                    : 'Search city, street or house number...'
                }
                className="w-full text-xs pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00407a] focus:bg-white text-slate-900 shadow-2xs transition-all"
              />
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin absolute right-3 top-3" />
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowSearchResults(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>

            {/* GPS Locate Button */}
            <button
              type="button"
              onClick={handleLocateMe}
              title={currentLocale === 'ru' ? 'Мое местоположение' : 'My location'}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            >
              <Navigation className="w-4 h-4 text-[#00407a]" />
            </button>
          </div>

          {/* Autocomplete Suggestions Dropdown - Elevated above map panes with high z-index and shadow */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute left-3 right-3 top-14 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-60 overflow-y-auto divide-y divide-slate-100 z-50">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={async () => {
                    if (item.lat !== 0 || item.lng !== 0) {
                      moveMapTo(item.lat, item.lng);
                      setShowSearchResults(false);
                      setSearchQuery(item.label);
                    } else {
                      // Suggestion without pre-computed coords (e.g. from browser ymaps.suggest)
                      setShowSearchResults(false);
                      setSearchQuery(item.label);
                      setIsSearching(true);
                      try {
                        if ((window as any).ymaps?.geocode) {
                          const ymaps = (window as any).ymaps;
                          const geoRes = await ymaps.geocode(item.city || item.label, { results: 1 });
                          const first = geoRes.geoObjects.get(0);
                          if (first) {
                            const [gLat, gLng] = first.geometry.getCoordinates();
                            moveMapTo(gLat, gLng);
                            return;
                          }
                        }
                        const res = await fetch(`/api/geo/search?q=${encodeURIComponent(item.city || item.label)}&locale=${encodeURIComponent(currentLocale)}`);
                        const data = await res.json();
                        if (data?.success && data.results?.[0]?.lat) {
                          moveMapTo(data.results[0].lat, data.results[0].lng);
                        }
                      } catch (gErr) {
                        console.warn('Failed to resolve coordinates for suggestion:', gErr);
                      } finally {
                        setIsSearching(false);
                      }
                    }
                  }}
                  className="w-full p-2.5 text-left text-xs hover:bg-blue-50/60 flex items-start gap-2 text-slate-800 transition-colors cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#00407a] shrink-0 mt-0.5" />
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map Viewport Area - Isolated stacking context to prevent map panes and controls from escaping */}
        <div className="relative flex-1 w-full bg-slate-100 min-h-[240px] z-0 isolate">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Center Crosshair / Floating Pin hint */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 pointer-events-none z-10">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {activeProvider === 'yandex' ? 'Yandex Maps' : 'OpenStreetMap'}
            </span>
          </div>

          {/* Geocoding Loading Indicator */}
          {isGeocoding && (
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 shadow-md text-xs font-semibold text-slate-800 flex items-center gap-2 z-10 animate-fade-in">
              <Loader2 className="w-3.5 h-3.5 text-[#00407a] animate-spin" />
              <span>
                {currentLocale === 'ru' ? 'Определяем адрес...' : currentLocale === 'zh' ? '正在解析地址...' : 'Detecting address...'}
              </span>
            </div>
          )}

          {/* Permission Denied Assistance Modal / Banner */}
          {showPermissionHelp && (
            <div className="absolute inset-x-3 top-3 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-amber-300 shadow-xl animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                    <Lock className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                      {currentLocale === 'ru'
                        ? 'Как включить доступ к геолокации'
                        : currentLocale === 'zh'
                        ? '如何在浏览器中开启位置访问'
                        : 'How to allow location access'}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      {currentLocale === 'ru' ? (
                        <>
                          Нажмите на значок <strong className="text-slate-900">замка 🔒</strong> в строке браузера слева от адреса сайта, переключите пункт <strong className="text-slate-900">«Геопозиция»</strong> в положение <strong className="text-emerald-700">«Разрешить»</strong>, затем нажмите кнопку повтора:
                        </>
                      ) : currentLocale === 'zh' ? (
                        <>
                          请点击浏览器地址栏左侧的 <strong className="text-slate-900">小锁图标 🔒</strong>，将 <strong className="text-slate-900">“位置信息”</strong> 设为 <strong className="text-emerald-700">“允许”</strong>，然后点击重试：
                        </>
                      ) : (
                        <>
                          Click the <strong className="text-slate-900">lock icon 🔒</strong> in your browser address bar, set <strong className="text-slate-900">Location</strong> to <strong className="text-emerald-700">Allow</strong>, then retry:
                        </>
                      )}
                    </p>

                    <div className="flex items-center gap-2 mt-2.5">
                      <button
                        type="button"
                        onClick={handleLocateMe}
                        className="px-3 py-1.5 bg-[#00407a] hover:bg-[#003366] text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>
                          {currentLocale === 'ru' ? 'Повторить определение' : currentLocale === 'zh' ? '再次检测位置' : 'Retry detection'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPermissionHelp(false)}
                        className="px-2.5 py-1.5 text-[11px] text-slate-500 hover:text-slate-700 font-medium transition-colors"
                      >
                        {currentLocale === 'ru' ? 'Понятно' : currentLocale === 'zh' ? '知道了' : 'Dismiss'}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPermissionHelp(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="absolute bottom-3 left-3 right-3 bg-red-50 text-red-700 border border-red-200 text-xs px-3 py-2 rounded-xl flex items-center justify-between gap-2 z-10 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPermissionHelp(true)}
                className="text-[11px] underline font-bold text-red-800 hover:text-red-950 shrink-0"
              >
                {currentLocale === 'ru' ? 'Инструкция' : currentLocale === 'zh' ? '查看说明' : 'How to fix'}
              </button>
            </div>
          )}
        </div>

        {/* Bottom Address Entry & Confirmation Panel (Modern Clean UX) */}
        <div className="bg-white border-t border-slate-200 p-3 sm:p-4 shrink-0 space-y-3 shadow-lg">
          
          {/* Main Detected Location / City Banner */}
          <div className="flex items-center justify-between gap-3 bg-slate-50/80 rounded-xl px-3 py-2 border border-slate-200/70">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#00407a] flex items-center justify-center shrink-0 border border-blue-100">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 truncate text-xs text-slate-700">
                <span className="font-bold text-slate-900 mr-1.5">
                  {[addressDetails.city, addressDetails.state, addressDetails.country].filter(Boolean).join(', ') || (currentLocale === 'ru' ? 'Точка на карте' : 'Selected location')}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  ({coords.lat.toFixed(5)}, {coords.lng.toFixed(5)})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={isLocating}
                title={currentLocale === 'ru' ? 'Автоматически определить мое местоположение' : 'Auto-detect my location'}
                className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#00407a] text-[11px] font-bold border border-blue-200/80 flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>
                  {isLocating
                    ? (currentLocale === 'ru' ? 'Определяем...' : currentLocale === 'zh' ? '正在定位...' : 'Locating...')
                    : (currentLocale === 'ru' ? 'Мое место' : currentLocale === 'zh' ? '自动定位' : 'Auto-detect')}
                </span>
              </button>

              {isGeocoding && (
                <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium shrink-0 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span className="hidden sm:inline">
                    {currentLocale === 'ru' ? 'Определяем...' : currentLocale === 'zh' ? '解析中...' : 'Detecting...'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Structured Address Form Inputs */}
          <div className="space-y-2.5">
            {/* Primary Address Row: Street & House Number */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <div className="col-span-2 sm:col-span-3">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {currentLocale === 'ru' ? 'Улица / Проспект / Адрес' : currentLocale === 'zh' ? '街道 / 详细地址' : 'Street / Address'}
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={addressDetails.street || ''}
                    onChange={(e) => setAddressDetails((prev) => ({ ...prev, street: e.target.value }))}
                    placeholder={currentLocale === 'ru' ? 'напр. ул. Ленина' : currentLocale === 'zh' ? '如: 建设路 / 商业街' : 'e.g. Main Street'}
                    className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] text-slate-900 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {currentLocale === 'ru' ? 'Дом' : currentLocale === 'zh' ? '门牌号' : 'House / No.'}
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={addressDetails.houseNumber || ''}
                  onChange={(e) => setAddressDetails((prev) => ({ ...prev, houseNumber: e.target.value }))}
                  placeholder={currentLocale === 'ru' ? '12А' : '12'}
                  className="w-full text-xs sm:text-sm px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] text-slate-900 transition-all font-medium"
                />
              </div>
            </div>

            {/* Secondary Address Row: Apt/Suite, Entrance, Floor, Intercom/Notes */}
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  {currentLocale === 'ru' ? 'Кв. / Офис' : currentLocale === 'zh' ? '公寓/室' : 'Apt / Suite'}
                </label>
                <input
                  type="text"
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  placeholder="24"
                  className="w-full text-xs px-2.5 py-1.5 sm:py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#00407a] rounded-xl focus:outline-none transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  {currentLocale === 'ru' ? 'Подъезд' : currentLocale === 'zh' ? '单元门' : 'Entrance'}
                </label>
                <input
                  type="text"
                  value={entrance}
                  onChange={(e) => setEntrance(e.target.value)}
                  placeholder="1"
                  className="w-full text-xs px-2.5 py-1.5 sm:py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#00407a] rounded-xl focus:outline-none transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  {currentLocale === 'ru' ? 'Этаж' : currentLocale === 'zh' ? '楼层' : 'Floor'}
                </label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="3"
                  className="w-full text-xs px-2.5 py-1.5 sm:py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#00407a] rounded-xl focus:outline-none transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1 truncate">
                  {currentLocale === 'ru' ? 'Домофон' : currentLocale === 'zh' ? '门禁码' : 'Intercom'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="24K"
                  className="w-full text-xs px-2.5 py-1.5 sm:py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#00407a] rounded-xl focus:outline-none transition-all text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 hidden sm:block truncate">
              {currentLocale === 'ru'
                ? 'Адрес определился автоматически. Вы можете скорректировать поля.'
                : currentLocale === 'zh'
                ? '地图已自动反查地址，您可按需微调修改。'
                : 'Auto-detected from pin. You can edit any field above.'}
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {currentLocale === 'ru' ? 'Отмена' : currentLocale === 'zh' ? '取消' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={isGeocoding || !coords.lat}
                className="px-6 py-2.5 bg-[#F5A602] hover:bg-[#E09500] active:scale-[0.98] text-slate-950 text-xs sm:text-sm font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>
                  {currentLocale === 'zh'
                    ? '确认此收货地址'
                    : currentLocale === 'ru'
                    ? 'Подтвердить адрес доставки'
                    : 'Confirm Delivery Address'}
                </span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

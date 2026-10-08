import React, { useState } from 'react';
import { X, MapPin, Check, ExternalLink, Trash2 } from 'lucide-react';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';
import Link from 'next/link';
import { AddressMapPicker, StructuredAddress } from '@/components/address/AddressMapPicker';

export interface UserAddressOption {
  id: string;
  city: string;
  country: string;
  addressLine1: string;
  isDefault: boolean;
  label?: string | null;
}

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAddress: string;
  onSelectAddress: (address: string, details?: Partial<UserAddressOption>) => void;
  onRemoveAddress?: (id: string) => void;
  userAddresses?: UserAddressOption[];
  isAuthenticated?: boolean;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentAddress,
  onSelectAddress,
  onRemoveAddress,
  userAddresses = [],
  isAuthenticated = false,
}) => {
  const { tModals } = useStorefrontTranslation();
  const [customAddress, setCustomAddress] = useState('');
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customAddress.trim();
    if (trimmed) {
      onSelectAddress(trimmed, {
        addressLine1: trimmed,
        city: trimmed.split(',')[0]?.trim() || trimmed,
        country: trimmed.split(',')[1]?.trim() || '',
      });
      setCustomAddress('');
      onClose();
    }
  };

  const handleMapConfirm = (addr: StructuredAddress) => {
    const chosen = addr.formattedAddress || `${addr.city}, ${addr.country}`;
    onSelectAddress(chosen, {
      city: addr.city,
      country: addr.country,
      addressLine1: addr.street ? `${addr.street} ${addr.houseNumber || ''}`.trim() : chosen,
      label: addr.street || addr.city,
    });
    setIsMapPickerOpen(false);
    onClose();
  };

  const formatAddressLabel = (addr: UserAddressOption) => {
    if (addr.city && addr.country) {
      return `${addr.city}, ${addr.country}`;
    }
    return addr.city || addr.country || addr.addressLine1;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#00407a]" />
            <h3 className="text-base font-bold text-slate-900">
              {tModals('selectAddress')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Interactive Map Picker Button */}
          <button
            type="button"
            onClick={() => setIsMapPickerOpen(true)}
            className="w-full p-3.5 rounded-xl border-2 border-dashed border-[#00407a]/40 bg-gradient-to-r from-blue-50/80 via-white to-amber-50/40 hover:border-[#00407a] hover:bg-blue-50/90 transition-all text-left flex items-center justify-between group shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00407a] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 block group-hover:text-[#00407a] transition-colors">
                  {tModals('selectOnMap')}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {tModals('selectOnMapDesc')}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-[#00407a] bg-white border border-blue-200 px-2.5 py-1 rounded-lg group-hover:bg-[#00407a] group-hover:text-white transition-all shadow-2xs shrink-0 hidden sm:inline-block">
              &rarr;
            </span>
          </button>

          {/* Saved / Recent Delivery Addresses */}
          {userAddresses.length > 0 ? (
            <div>
              <p className="text-xs text-slate-500 font-semibold mb-2">
                {isAuthenticated ? tModals('savedLocations') : tModals('recentAddresses')}
              </p>
              <div className="space-y-2">
                {userAddresses.map((addr) => {
                  const label = formatAddressLabel(addr);
                  const isSelected =
                    currentAddress === label ||
                    currentAddress === addr.addressLine1 ||
                    currentAddress === addr.city;
                  return (
                    <div
                      key={addr.id}
                      className={`group w-full p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-[#00407a] text-[#00407a] shadow-xs'
                          : 'border-slate-200 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectAddress(label, addr);
                          onClose();
                        }}
                        className="flex-1 min-w-0 flex items-start gap-2.5 cursor-pointer text-left"
                      >
                        <MapPin
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isSelected ? 'text-[#00407a]' : 'text-slate-400'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">{label}</p>
                          <p className="text-[11px] font-normal text-slate-500 truncate mt-0.5">
                            {addr.addressLine1}
                            {addr.label && addr.label !== label ? ` · ${addr.label}` : ''}
                            {addr.isDefault ? ` · ${tModals('defaultBadge')}` : ''}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSelected && (
                          <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[#00407a]">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {/* Allow removing local/guest saved address if handler provided */}
                        {onRemoveAddress && addr.id.startsWith('local-') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveAddress(addr.id);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Remove from recent"
                            aria-label="Remove address"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Manage link for authenticated users */}
              {isAuthenticated && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <Link
                    href="/dashboard/addresses"
                    onClick={onClose}
                    className="flex items-center gap-1.5 text-xs text-[#00407a] hover:underline font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {tModals('manageSavedAddresses')}
                  </Link>
                </div>
              )}
            </div>
          ) : isAuthenticated ? (
            /* Logged in but no addresses yet */
            <div className="text-center py-4">
              <MapPin className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-500 mb-3">{tModals('noSavedAddresses')}</p>
              <Link
                href="/dashboard/addresses"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-xs text-[#00407a] hover:underline font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {tModals('addFirstAddress')}
              </Link>
            </div>
          ) : null}

          {/* Custom / manual entry */}
          <form
            onSubmit={handleCustomSubmit}
            className={`${userAddresses.length > 0 ? 'pt-3 border-t border-slate-200' : ''}`}
          >
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              {tModals('enterCustomAddress')}:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder={tModals('addressPlaceholder')}
                className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-[#00407a]"
              />
              <button
                type="submit"
                className="bg-[#00407a] hover:bg-[#003366] text-white text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer transition-colors"
              >
                {tModals('saveAddress')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Interactive Map Picker Modal */}
      <AddressMapPicker
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        onConfirm={handleMapConfirm}
        initialAddress={currentAddress}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { X, MapPin, Check, ExternalLink } from 'lucide-react';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';
import Link from 'next/link';

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
  onSelectAddress: (address: string) => void;
  userAddresses?: UserAddressOption[];
  isAuthenticated?: boolean;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentAddress,
  onSelectAddress,
  userAddresses = [],
  isAuthenticated = false,
}) => {
  const { tModals } = useStorefrontTranslation();
  const [customAddress, setCustomAddress] = useState('');

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAddress.trim()) {
      onSelectAddress(customAddress.trim());
      setCustomAddress('');
      onClose();
    }
  };

  const formatAddressLabel = (addr: UserAddressOption) => {
    return `${addr.city}, ${addr.country}`;
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
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Saved Addresses from DB */}
          {userAddresses.length > 0 ? (
            <div>
              <p className="text-xs text-slate-500 font-medium mb-2">
                {tModals('savedLocations')}
              </p>
              <div className="space-y-2">
                {userAddresses.map((addr) => {
                  const label = formatAddressLabel(addr);
                  const isSelected = currentAddress === label || currentAddress === addr.city;
                  return (
                    <button
                      key={addr.id}
                      onClick={() => {
                        onSelectAddress(label);
                        onClose();
                      }}
                      className={`w-full p-3 rounded-xl border text-left flex items-start justify-between gap-2 text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-[#00407a] text-[#00407a] shadow-xs'
                          : 'border-slate-200 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-[#00407a]' : 'text-slate-400'}`} />
                        <div className="min-w-0">
                          <p className="font-bold">{label}</p>
                          <p className="text-xs font-normal text-slate-500 truncate mt-0.5">
                            {addr.addressLine1}
                            {addr.label ? ` · ${addr.label}` : ''}
                            {addr.isDefault ? ' · Default' : ''}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#00407a] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Manage link */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <Link
                  href="/dashboard/addresses"
                  onClick={onClose}
                  className="flex items-center gap-1.5 text-xs text-[#00407a] hover:underline font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Manage saved addresses
                </Link>
              </div>
            </div>
          ) : isAuthenticated ? (
            /* Logged in but no addresses yet */
            <div className="text-center py-4">
              <MapPin className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-500 mb-3">No saved addresses yet.</p>
              <Link
                href="/dashboard/addresses"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-xs text-[#00407a] hover:underline font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Add your first address
              </Link>
            </div>
          ) : null}

          {/* Custom / manual entry */}
          <form onSubmit={handleCustomSubmit} className={`${userAddresses.length > 0 ? 'pt-3 border-t border-slate-200' : ''}`}>
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
    </div>
  );
};

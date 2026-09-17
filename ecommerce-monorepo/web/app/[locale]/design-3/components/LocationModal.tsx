import React, { useState } from 'react';
import { X, MapPin, Check, Plus } from 'lucide-react';
import { useStorefrontTranslation } from '@/hooks/useStorefrontTranslation';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAddress: string;
  onSelectAddress: (address: string) => void;
}

const SAVED_ADDRESSES = [
  'Minsk, Pobediteley Ave 12',
  'Minsk, Independence Ave 45',
  'Minsk, Dzerzhinsky Ave 104',
  'Minsk, Masherova Ave 19',
  'Minsk, Pritytskogo St 29',
];

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentAddress,
  onSelectAddress,
}) => {
  const { tModals } = useStorefrontTranslation();
  const [customAddress, setCustomAddress] = useState('');

  if (!isOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customAddress.trim()) {
      onSelectAddress(customAddress.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
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

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-500 font-medium">
            {tModals('savedLocations')}
          </p>

          {/* Saved Addresses */}
          <div className="space-y-2">
            {SAVED_ADDRESSES.map((addr) => {
              const isSelected = currentAddress.toLowerCase().includes(addr.toLowerCase());
              return (
                <button
                  key={addr}
                  onClick={() => {
                    onSelectAddress(addr);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-[#00407a] text-[#00407a] shadow-xs'
                      : 'border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className={`w-4 h-4 ${isSelected ? 'text-[#00407a]' : 'text-slate-400'}`} />
                    <span>{addr}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#00407a]" />}
                </button>
              );
            })}
          </div>

          {/* Enter New Address */}
          <form onSubmit={handleCustomSubmit} className="pt-3 border-t border-slate-200">
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

import React from 'react';
import { X, ClipboardList, Truck, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { INITIAL_ORDERS } from '../data/catalogData';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrdersModal: React.FC<OrdersModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#00407a]" />
            <h3 className="text-base font-bold text-slate-900">
              Your Hypermarket Orders
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {/* Active Order Card */}
          <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-sm">Order #DK-84920</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                  ACTIVE • COURIER EN ROUTE
                </span>
              </div>
              <span className="text-xs font-bold text-blue-900">128.50 BYN</span>
            </div>

            <div className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#00407a]" />
              <span>Estimated arrival: <strong className="text-slate-800">10:45 AM (in 18 min)</strong></span>
            </div>

            {/* Courier progress bar */}
            <div className="space-y-1 mb-3">
              <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                <span>Darkstore Minsk #1</span>
                <span className="text-[#00407a] font-bold">Courier on Pobediteley Ave</span>
                <span>Your Door</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-[#00407a] h-full rounded-full w-3/4 animate-pulse" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-blue-100">
              <MapPin className="w-4 h-4 text-[#00407a] shrink-0" />
              <span className="truncate">Destination: <strong>Minsk, Pobediteley Ave 12, Apt 48</strong></span>
            </div>
          </div>

          {/* Past Orders */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Past Orders
            </h4>
            <div className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-white flex items-center justify-between text-xs">
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <span>Order #DK-79114</span>
                  <span className="text-slate-400 font-normal">• Yesterday, 18:30</span>
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  7 items • Delivered to Door
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-slate-900">215.80 BYN</div>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 justify-end">
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

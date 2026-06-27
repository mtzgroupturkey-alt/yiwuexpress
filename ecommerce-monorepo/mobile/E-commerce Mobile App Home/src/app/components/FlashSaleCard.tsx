import { useEffect, useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Zap } from "lucide-react";

interface FlashSaleCardProps {
  image: string;
  productName: string;
  originalPrice: number;
  currentPrice: number;
  discount: number;
  endTime: Date;
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="bg-white/15 backdrop-blur-sm text-white text-sm font-bold font-mono w-9 h-9 rounded-lg flex items-center justify-center border border-white/20">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[8px] text-white/60 mt-0.5 uppercase tracking-widest">{label}</span>
    </div>
  );
}

export function FlashSaleCard({
  image,
  productName,
  originalPrice,
  currentPrice,
  discount,
  endTime,
}: FlashSaleCardProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const distance = endTime.getTime() - Date.now();
      if (distance < 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        hours: Math.floor(distance / 3600000),
        minutes: Math.floor((distance % 3600000) / 60000),
        seconds: Math.floor((distance % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return (
    <div className="relative w-[220px] h-[290px] rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
      {/* Full-bleed product image */}
      <ImageWithFallback
        src={image}
        alt={productName}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark gradient — stronger at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

      {/* Discount badge — top left */}
      <div className="absolute top-3 left-3 flex items-center gap-1 bg-[#F59E0B] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">
        <Zap className="w-2.5 h-2.5 fill-white" />
        {discount}% OFF
      </div>

      {/* Content — anchored to bottom */}
      <div className="absolute inset-x-0 bottom-0 p-3.5">
        <p className="text-white text-[11px] font-medium leading-snug line-clamp-2 mb-2 opacity-90">
          {productName}
        </p>

        <div className="flex items-baseline gap-1.5 mb-3">
          <span className="text-white text-xl font-bold">${currentPrice.toFixed(2)}</span>
          <span className="text-white/50 text-xs line-through">${originalPrice.toFixed(2)}</span>
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-1.5">
          <TimeBlock value={timeLeft.hours} label="hr" />
          <span className="text-white/50 text-xs font-bold mb-3">:</span>
          <TimeBlock value={timeLeft.minutes} label="min" />
          <span className="text-white/50 text-xs font-bold mb-3">:</span>
          <TimeBlock value={timeLeft.seconds} label="sec" />

          <button className="ml-auto bg-[#F59E0B] text-white text-[10px] font-bold px-3 py-1.5 rounded-full active:scale-95 transition-transform shadow-md">
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

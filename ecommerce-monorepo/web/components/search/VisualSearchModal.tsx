'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Camera, 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  Link as LinkIcon, 
  Sparkles, 
  AlertCircle,
  RefreshCw,
  Search,
  Check
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface DetectedVisualAttributes {
  category?: string;
  keywords: string[];
  colors?: string[];
  materials?: string[];
  style?: string;
  confidence: number;
}

interface VisualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VisualSearchModal: React.FC<VisualSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const t = useTranslations('VisualSearch');
  const locale = useLocale();
  const router = useRouter();

  // Step 1 = Upload, Step 2 = Confirmation
  const [step, setStep] = useState<1 | 2>(1);
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedAttrs, setDetectedAttrs] = useState<DetectedVisualAttributes | null>(null);
  const [resultHash, setResultHash] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opened or closed
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setImagePreview(null);
      setSelectedFile(null);
      setSelectedUrl(null);
      setImageUrlInput('');
      setIsUrlMode(false);
      setAnalyzing(false);
      setError(null);
      setDetectedAttrs(null);
      setResultHash(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setError(null);

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('errorTooLarge'));
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError(t('errorInvalidFormat'));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setSelectedFile(file);
    setSelectedUrl(null);

    // Call API to analyze attributes and prepare confirmation step
    await analyzeImage({ file });
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    setError(null);
    const url = imageUrlInput.trim();
    setImagePreview(url);
    setSelectedUrl(url);
    setSelectedFile(null);

    await analyzeImage({ url });
  };

  const analyzeImage = async ({ file, url }: { file?: File; url?: string }) => {
    setAnalyzing(true);
    setError(null);

    try {
      let resp: Response;
      if (file) {
        const formData = new FormData();
        formData.append('image', file);
        resp = await fetch('/api/products/search/image', {
          method: 'POST',
          body: formData,
        });
      } else if (url) {
        resp = await fetch('/api/products/search/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: url }),
        });
      } else {
        throw new Error('No input');
      }

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || t('errorFailed'));
      }

      setDetectedAttrs(data.detected || null);
      setResultHash(data.hash || data.imageHash || null);
      // Move to Step 2: Confirmation
      setStep(2);
    } catch (err: any) {
      console.error('[VisualSearch] Analysis error:', err);
      setError(err?.message || t('errorFailed'));
      setStep(1);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmSearch = () => {
    if (!resultHash) return;
    onClose();
    // Navigate to Store page with visual search query params
    router.push(`/${locale}/store?visual=1&hash=${encodeURIComponent(resultHash)}`);
  };

  const handleRetake = () => {
    setStep(1);
    setImagePreview(null);
    setSelectedFile(null);
    setSelectedUrl(null);
    setImageUrlInput('');
    setDetectedAttrs(null);
    setResultHash(null);
    setError(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#00407a] flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {step === 1 ? t('dialogTitle') : t('confirmTitle')}
              </h2>
              <p className="text-xs text-slate-500">
                {step === 1 ? t('dialogSubtitle') : t('detected')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          {/* Analyzing Loading Overlay */}
          {analyzing && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                {imagePreview && (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-blue-400 shadow-md mb-2 relative">
                    <img 
                      src={imagePreview} 
                      alt="Uploaded preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[#00407a]/20 backdrop-blur-[1px] flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  {t('analyzing')}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {t('analyzingSubtitle')}
                </p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && !analyzing && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{error}</p>
              </div>
              <button
                onClick={handleRetake}
                className="text-xs font-bold text-red-700 underline cursor-pointer"
              >
                {t('tryAgain')}
              </button>
            </div>
          )}

          {/* STEP 1: Upload (Drag & Drop, Camera, Gallery, Paste URL) */}
          {step === 1 && !analyzing && (
            <div className="space-y-4">
              {/* Drag & Drop Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                  dragActive 
                    ? 'border-[#00407a] bg-blue-50/50 scale-[0.99]' 
                    : 'border-slate-300 hover:border-[#00407a] hover:bg-slate-50/80 bg-white'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6 text-[#00407a]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {t('dragDrop')}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {t('supports')}
                  </p>
                </div>

                {/* Mobile action shortcuts with >= 44px touch targets */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2 pt-2 border-t border-slate-100 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                    className="h-11 px-4 text-xs font-semibold rounded-xl bg-[#00407a] text-white hover:bg-[#00315c] flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-transform min-h-[44px]"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{t('takePhoto')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="h-11 px-4 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform min-h-[44px]"
                  >
                    <ImageIcon className="w-4 h-4 text-slate-600" />
                    <span>{t('chooseGallery')}</span>
                  </button>
                </div>
              </div>

              {/* Paste URL Accordion */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60">
                {!isUrlMode ? (
                  <button
                    type="button"
                    onClick={() => setIsUrlMode(true)}
                    className="w-full flex items-center justify-between text-xs font-medium text-slate-600 hover:text-[#00407a] transition-colors cursor-pointer py-1 min-h-[44px]"
                  >
                    <span className="flex items-center gap-2">
                      <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                      {t('orPasteUrl')}
                    </span>
                    <span className="text-[#00407a] font-bold text-[11px] underline">
                      {t('pasteUrl')}
                    </span>
                  </button>
                ) : (
                  <form onSubmit={handleUrlSubmit} className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block">
                      {t('orPasteUrl')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder={t('pasteUrlPlaceholder')}
                        className="flex-1 h-10 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#00407a]"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!imageUrlInput.trim()}
                        className="h-10 px-4 text-xs font-bold rounded-lg bg-[#00407a] text-white hover:bg-[#00315c] disabled:opacity-50 transition-colors cursor-pointer min-h-[40px]"
                      >
                        {t('search')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Confirmation View (Preview + Detected Attributes + Action Buttons) */}
          {step === 2 && !analyzing && detectedAttrs && (
            <div className="space-y-4">
              {/* Image Preview & Detected Highlights */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                {imagePreview && (
                  <div className="w-28 h-28 rounded-xl overflow-hidden bg-white border border-slate-300 shrink-0 shadow-xs flex items-center justify-center">
                    <img 
                      src={imagePreview} 
                      alt="Uploaded preview" 
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-2 text-left w-full">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {t('category')}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {detectedAttrs.category || 'General Products'}
                    </h3>
                  </div>

                  {detectedAttrs.colors && detectedAttrs.colors.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {t('colors')}
                      </span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {detectedAttrs.colors.map((c) => (
                          <span key={c} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {detectedAttrs.keywords && detectedAttrs.keywords.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {t('keywords')}
                      </span>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                        {detectedAttrs.keywords.join(' · ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: [Retake] [Search] */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 h-11 px-4 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-slate-500" />
                  <span>{t('retake')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSearch}
                  className="flex-1 h-11 px-4 text-xs font-bold rounded-xl bg-[#00407a] hover:bg-[#00315c] text-white flex items-center justify-center gap-1.5 shadow-md cursor-pointer min-h-[44px] transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>{t('search')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Privacy Notice Footer */}
          <p className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100">
            {t('privacyNotice')}
          </p>
        </div>
      </div>
    </div>
  );
};

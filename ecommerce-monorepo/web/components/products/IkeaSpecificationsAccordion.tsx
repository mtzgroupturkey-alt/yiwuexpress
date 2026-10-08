import React from 'react'
import { ChevronDown, ChevronUp, Box, CheckCircle, FileText, Info, Download, Check } from 'lucide-react'

interface IkeaSpecificationsAccordionProps {
  product: any
  locale: string
  currentSku: string
  openAccordions: Record<string, boolean>
  toggleAccordion: (section: string) => void
}

export function IkeaSpecificationsAccordion({
  product,
  locale,
  currentSku,
  openAccordions,
  toggleAccordion,
}: IkeaSpecificationsAccordionProps) {
  const hasTips = Boolean(product.attributes?.tips || product.attributes?.usage_tips)
  const pkgQty = product.dimensions?.packageQty || 1
  const heightVal = product.dimensions?.height || 17
  const lengthVal = product.dimensions?.length || 53
  const widthVal = product.dimensions?.width || 33
  const netWeightVal = product.weightKg ? `${product.weightKg} kg` : '3.70 kg'
  const grossWeightVal = product.dimensions?.grossWeightKg
    ? `${product.dimensions.grossWeightKg} kg`
    : `${((product.weightKg || 3.7) * 1.15).toFixed(2)} kg`
  const volumeVal = product.dimensions?.volumeL ? `${product.dimensions.volumeL} l` : '29.3 l'

  return (
    <div className="space-y-4 max-w-4xl my-6">
      {/* Accordion 1: Tips & Package Contents */}
      {hasTips && (
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs transition-all">
          <button
            type="button"
            onClick={() => toggleAccordion('tips')}
            className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-slate-50/80 hover:bg-slate-100/70 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  {locale === 'ru' ? 'Советы и комплектация' : locale === 'zh' ? '使用建议与套装规格' : 'Tips & Package Contents'}
                </h4>
                <p className="text-xs text-slate-500">
                  {locale === 'ru'
                    ? 'Рекомендации по уходу, безопасности и компоненты'
                    : locale === 'zh'
                    ? '安全使用提示、涂层防护与各锅具容量'
                    : 'Usage guidance, precautions & component details'}
                </p>
              </div>
            </div>
            {openAccordions.tips ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
          {openAccordions.tips && (
            <div className="p-5 sm:p-6 border-t border-slate-100 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line space-y-3 bg-white">
              <div>{product.attributes?.tips || product.attributes?.usage_tips}</div>
              {product.attributes?.designer && (
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                    {locale === 'ru' ? 'Дизайнер:' : locale === 'zh' ? '设计师：' : 'Designer:'}
                  </span>
                  <span className="font-medium text-slate-900">{product.attributes.designer}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Accordion 2: Product Dimensions and Packaging info */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs transition-all">
        <button
          type="button"
          onClick={() => toggleAccordion('dimensions')}
          className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-slate-50/80 hover:bg-slate-100/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                {locale === 'ru'
                  ? 'Размеры товара и упаковки'
                  : locale === 'zh'
                  ? '产品尺寸与包装信息'
                  : 'Product dimensions and Packaging info'}
              </h4>
              <p className="text-xs text-slate-500">
                {locale === 'ru'
                  ? 'Длина, ширина, высота, объем и вес'
                  : locale === 'zh'
                  ? '长宽高尺寸、净重、毛重与体积'
                  : 'Length, width, height, gross weight & volume'}
              </p>
            </div>
          </div>
          {openAccordions.dimensions ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
        {openAccordions.dimensions && (
          <div className="p-5 sm:p-6 border-t border-slate-100 bg-white">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                  {locale === 'ru' ? 'Кол-во в упак.' : locale === 'zh' ? '包装件数' : 'Package Qty'}
                </span>
                <span className="text-sm font-bold text-slate-900">{pkgQty}</span>
              </div>
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                  {locale === 'ru' ? 'Высота' : locale === 'zh' ? '高度' : 'Height'}
                </span>
                <span className="text-sm font-bold text-slate-900">{heightVal} cm</span>
              </div>
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                  {locale === 'ru' ? 'Длина' : locale === 'zh' ? '长度' : 'Length'}
                </span>
                <span className="text-sm font-bold text-slate-900">{lengthVal} cm</span>
              </div>
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                  {locale === 'ru' ? 'Ширина' : locale === 'zh' ? '宽度' : 'Width'}
                </span>
                <span className="text-sm font-bold text-slate-900">{widthVal} cm</span>
              </div>
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                  {locale === 'ru' ? 'Вес нетто' : locale === 'zh' ? '净重' : 'Net Weight'}
                </span>
                <span className="text-sm font-bold text-slate-900">{netWeightVal}</span>
              </div>
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                  {locale === 'ru' ? 'Вес брутто' : locale === 'zh' ? '毛重' : 'Gross Weight'}
                </span>
                <span className="text-sm font-bold text-slate-900">{grossWeightVal}</span>
              </div>
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                  {locale === 'ru' ? 'Объем' : locale === 'zh' ? '体积' : 'Volume'}
                </span>
                <span className="text-sm font-bold text-slate-900">{volumeVal}</span>
              </div>
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 block mb-1">
                  {locale === 'ru' ? 'Артикул' : locale === 'zh' ? '货号' : 'Item #'}
                </span>
                <span className="text-sm font-mono font-bold text-blue-800">{product.dromkokItemNo || currentSku}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accordion 3: Care instructions and Environment and materials */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs transition-all">
        <button
          type="button"
          onClick={() => toggleAccordion('care')}
          className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-slate-50/80 hover:bg-slate-100/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                {locale === 'ru'
                  ? 'Инструкция по уходу, экология и материалы'
                  : locale === 'zh'
                  ? '保养说明与环保材质'
                  : 'Care instructions and Environment and materials'}
              </h4>
              <p className="text-xs text-slate-500">
                {locale === 'ru'
                  ? 'Совместимость с плитами, мойка и состав деталей'
                  : locale === 'zh'
                  ? '炉灶兼容性、清洗说明与零部件材质'
                  : 'Hob compatibility, cleaning rules & materials breakdown'}
              </p>
            </div>
          </div>
          {openAccordions.care ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
        {openAccordions.care && (
          <div className="p-5 sm:p-6 border-t border-slate-100 bg-white space-y-6">
            {/* Care Instructions */}
            <div>
              <h5 className="text-xs uppercase tracking-wider font-bold text-slate-900 mb-2">
                {locale === 'ru' ? 'Инструкции по уходу' : locale === 'zh' ? '保养说明' : 'Care instructions'}
              </h5>
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                {product.attributes?.care_instructions ||
                  '• Handwash only.\n• Suitable for use on gas hob.\n• Suitable for use on induction hob.\n• Suitable for use on glass ceramic hob.\n• Suitable for use on cast iron hob.\n• Wash this product before using it for the first time. Note – hand wash only.\n• The cookware and stainless steel lids are oven-safe, but the glass lid is not.'}
              </div>
            </div>

            {/* Hob Suitability Badges */}
            <div>
              <h5 className="text-xs uppercase tracking-wider font-bold text-slate-900 mb-2.5">
                {locale === 'ru' ? 'Совместимость с варочными панелями' : locale === 'zh' ? '适用炉具' : 'Suitable For'}
              </h5>
              <div className="flex flex-wrap gap-2">
                {['Gas Hob', 'Induction Hob', 'Glass Ceramic Hob', 'Cast Iron Hob'].map((hob) => (
                  <span
                    key={hob}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold text-xs"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    {hob}
                  </span>
                ))}
              </div>
            </div>

            {/* Environment & Materials Breakdown */}
            <div>
              <h5 className="text-xs uppercase tracking-wider font-bold text-slate-900 mb-2">
                {locale === 'ru' ? 'Экология и материалы' : locale === 'zh' ? '环保与材料' : 'Environment & materials'}
              </h5>
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                {product.attributes?.environment_materials ||
                  (product.material
                    ? `• Basematerial: ${product.material}`
                    : '• Basematerial: Aluminium, Sol-gel ceramic non-stick coating\n• Handle / Rivet / Disc / Lid / Rim: Stainless steel\n• Lid: Tempered glass\n• Washer: Silicone rubber, Stainless steel')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accordion 4: Assembly instructions and documentation */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs transition-all">
        <button
          type="button"
          onClick={() => toggleAccordion('documents')}
          className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-slate-50/80 hover:bg-slate-100/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                {locale === 'ru'
                  ? 'Инструкции по сборке и документация'
                  : locale === 'zh'
                  ? '组装说明与官方文档'
                  : 'Assembly instructions and documentation'}
              </h4>
              <p className="text-xs text-slate-500">
                {locale === 'ru'
                  ? 'Руководства пользователя и файлы для загрузки (PDF)'
                  : locale === 'zh'
                  ? '产品安装说明书与多语言手册下载 (PDF)'
                  : 'Official manuals, user guides & downloads'}
              </p>
            </div>
          </div>
          {openAccordions.documents ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
        {openAccordions.documents && (
          <div className="p-5 sm:p-6 border-t border-slate-100 bg-white">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                    PDF
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-900 text-xs sm:text-sm">
                      {product.name} {locale === 'ru' ? 'Инструкция' : locale === 'zh' ? '使用说明书' : 'Manual & Guide'}
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      {locale === 'ru'
                        ? 'Официальный документ (Многоязычный)'
                        : locale === 'zh'
                        ? '官方安装与维护指南（多语言）'
                        : 'Official Document • Multilingual PDF'}
                    </p>
                  </div>
                </div>
                <a
                  href="https://resources.ikea.cn/cn/en/manuals/guldoering-8-piece-cookware-set-non-stick-coating-stainless-steel-black-grey__AA-2653504-1-100.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-xs transition-all shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>{locale === 'ru' ? 'Скачать' : locale === 'zh' ? '下载文档' : 'Download'}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

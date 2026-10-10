import React from 'react'

interface BynSymbolProps {
  className?: string
  size?: number | string
}

/**
 * Official Graphic Symbol of the Belarusian Ruble (BYN)
 * Approved by the National Bank of the Republic of Belarus (NBRB).
 * Stylized Cyrillic letter "Б" with a horizontal strike line through the center.
 */
export function BynSymbol({ className = 'inline-block w-[0.95em] h-[0.95em] align-[-0.125em]', size }: BynSymbolProps) {
  const style = size ? { width: size, height: size } : undefined

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 2.65 2.65"
      fill="currentColor"
      className={className}
      style={style}
      aria-label="BYN"
      role="img"
    >
      <path d="m.540018-.00017v1.76423h-.428397v.24908h.428397v.63252h1.03611c.28397 0 .48463-.03667.60255-.11007s.20665-.16768.26561-.28318c.06017-.11671.08992-.24213.08992-.37569 0-.16364-.04151-.30671-.12454-.42943-.08302-.12392-.19339-.2082-.33176-.2527-.13717-.0445-.32261-.06666-.55604-.06666h-.631486v-.81597h1.36633v-.31213h-1.71669zm.350366 1.42937h.467156c.23223 0 .39673.01207.49299.03617.09626.02406.17116.07285.22531.14625.05415.07339.08113.1649.08113.2744 0 .154-.04705.26923-.14211.34623-.09385.07701-.23535.11576-.42426.11576h-.700216v-.33487h.621156v-.24908h-.621156v-.33486z" />
    </svg>
  )
}

export default BynSymbol

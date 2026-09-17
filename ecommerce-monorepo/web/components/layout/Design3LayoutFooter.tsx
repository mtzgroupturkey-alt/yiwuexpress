'use client';

import React, { useState } from 'react';
import { Footer } from '@/app/[locale]/design-3/components/Footer';
import { CatalogModal } from '@/app/[locale]/design-3/components/CatalogModal';
import { OrdersModal } from '@/app/[locale]/design-3/components/OrdersModal';
import { MemberModal } from '@/app/[locale]/design-3/components/MemberModal';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

export function Design3LayoutFooter() {
  const locale = useLocale();
  const router = useRouter();

  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  return (
    <>
      <Footer
        onOpenCatalog={() => setIsCatalogOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenMemberModal={() => setIsMemberModalOpen(true)}
      />

      <CatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelectDepartment={(deptName, subcategory) => {
          setIsCatalogOpen(false);
          router.push(
            `/${locale}/store?department=${encodeURIComponent(deptName)}${
              subcategory ? `&sub=${encodeURIComponent(subcategory)}` : ''
            }`
          );
        }}
      />

      <OrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
      />

      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
      />
    </>
  );
}

const fs = require('fs');
let code = fs.readFileSync('app/[locale]/store/page.tsx', 'utf8');

const target = \  const { data: productsData, isLoading: isCatalogLoading } = useQuery({
    queryKey: ['products', 'store-catalog', locale],
    queryFn: async () => {
      const res = await fetch(\\\/api/products?limit=all&locale=\\\\\\);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !isVisualSearch,
    staleTime: 5 * 60 * 1000,
  });\;

const replacement = \  const { data: productsData, isLoading: isCatalogLoading } = useQuery({
    queryKey: ['products', 'store-catalog', locale, currentPage, categoryParam, searchParam, sortParam],
    queryFn: async () => {
      const qp = new URLSearchParams({
        page: String(currentPage),
        limit: '24',
        locale,
      });
      if (categoryParam) qp.set('category', categoryParam);
      if (searchParam) qp.set('search', searchParam);
      if (sortParam) qp.set('sort', sortParam);
      const res = await fetch(\\\/api/products?\\\\\\);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !isVisualSearch,
    placeholderData: (previousData) => previousData,
    staleTime: 60 * 1000,
  });\;

code = code.replace(target, replacement);
fs.writeFileSync('app/[locale]/store/page.tsx', code);
console.log('Fixed store/page.tsx to use server pagination again!');

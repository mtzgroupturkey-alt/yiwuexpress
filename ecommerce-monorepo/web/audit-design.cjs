const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3005';
const OUT = path.join(process.env.USERPROFILE, '.gstack', 'projects', 'yiwuexpress', 'designs', 'design-audit-20260716');
fs.mkdirSync(path.join(OUT, 'screenshots'), { recursive: true });

const pages = [
  { name: 'home', url: '/' },
  { name: 'about', url: '/about' },
  { name: 'contact', url: '/contact' },
  { name: 'services', url: '/services' },
  { name: 'products', url: '/products' },
  { name: 'calculator', url: '/calculator' },
  { name: 'quotes', url: '/quotes' },
  { name: 'blog', url: '/blog' },
];

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Users\\ASUS\\AppData\\Local\\ms-playwright\\chromium-1208\\chrome-win64\\chrome.exe',
    args: ['--no-sandbox']
  });
  const results = {};

  for (const p of pages) {
    const errors = [];
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

    try {
      await page.goto(BASE + p.url, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (e) {
      errors.push('GOTO FAIL: ' + e.message);
    }

    // Desktop screenshot
    await page.screenshot({ path: path.join(OUT, 'screenshots', p.name + '-desktop.png'), fullPage: true });

    // Design system extraction
    const ds = await page.evaluate(() => {
      const els = [...document.querySelectorAll('*')].slice(0, 600);
      const fonts = [...new Set(els.map(e => getComputedStyle(e).fontFamily))];
      const colors = [...new Set(els.flatMap(e => [getComputedStyle(e).color, getComputedStyle(e).backgroundColor]).filter(c => c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent'))];
      const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => ({ tag: h.tagName, text: (h.textContent||'').trim().slice(0,50), size: getComputedStyle(h).fontSize, weight: getComputedStyle(h).fontWeight }));
      const bodySize = getComputedStyle(document.body).fontSize;
      return { fonts, colors: colors.slice(0, 30), headings, bodySize };
    });

    // Mobile screenshot
    const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const mpage = await mctx.newPage();
    try {
      await mpage.goto(BASE + p.url, { waitUntil: 'networkidle', timeout: 30000 });
      await mpage.screenshot({ path: path.join(OUT, 'screenshots', p.name + '-mobile.png'), fullPage: true });
    } catch (e) { errors.push('MOBILE GOTO FAIL: ' + e.message); }
    await mctx.close();

    results[p.name] = { url: p.url, errors, ds, screenshotDesktop: p.name + '-desktop.png', screenshotMobile: p.name + '-mobile.png' };
    console.log(`\n=== ${p.name} (${p.url}) ===`);
    console.log('console errors:', errors.length);
    errors.slice(0, 8).forEach(e => console.log('  - ' + e.slice(0, 140)));
    console.log('fonts:', ds.fonts.slice(0, 4).join(' | '));
    console.log('body size:', ds.bodySize);
    console.log('headings:', ds.headings.length);
    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, 'audit-data.json'), JSON.stringify(results, null, 2));
  console.log('\nWROTE audit data to', OUT);
})();

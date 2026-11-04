/** Export the same editorial source as the web portfolio, with public PDF links. */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1040, height: 1000 } });
  await page.goto(`${process.env.PORTFOLIO_URL || 'http://127.0.0.1:4318'}/fakeeyes/`);
  await page.evaluate(async () => {
    for (const image of document.images) image.loading = 'eager';
    await Promise.all([...document.images].map(image => image.decode()));
    await document.fonts.ready;
    for (const link of document.querySelectorAll('a[href]')) {
      const href = link.getAttribute('href');
      if (href.startsWith('#')) continue;
      if (link.origin === location.origin) link.href = new URL(href, 'https://devcms.me/fakeeyes/').href;
    }
  });
  await page.emulateMedia({ media: 'print' });
  const heights = await page.locator('.sheet').evaluateAll(sheets => sheets.map(s => ({ id: s.id, height: Math.round(s.getBoundingClientRect().height) })));
  await page.pdf({ path: path.join(root, 'fakeeyes/choi-minseok-portfolio.pdf'), printBackground: true, preferCSSPageSize: true, tagged: true, outline: true });
  console.info(JSON.stringify({ exported: 'fakeeyes/choi-minseok-portfolio.pdf', sections: heights }));
} finally { await browser.close(); }

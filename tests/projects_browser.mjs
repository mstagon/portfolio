/** Browser regression suite; set PLAYWRIGHT_MODULE to an installed Playwright entry. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const root = new URL('../', import.meta.url);
const projects = JSON.parse(await fs.readFile(new URL('projects/data/projects.json', root), 'utf8'));
const total = projects.length;
const companyCount = projects.filter(p => p.category === 'company').length;
const base = process.env.PORTFOLIO_URL || 'http://127.0.0.1:4318';
const output = process.env.QA_OUTPUT || '/tmp/project-archive-qa';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const errors = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
const visible = () => page.locator('.project-item:visible').count();
const decodeVisible = async () => page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].filter(image => image.getBoundingClientRect().top < innerHeight && image.getBoundingClientRect().bottom > 0).map(image => image.decode())); });
const noOverflow = async () => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Horizontal overflow: ${page.url()}`);
try {
  const foundation = async () => page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const root = getComputedStyle(document.documentElement);
    return { background: body.backgroundColor, color: body.color, font: body.fontFamily, accent: root.getPropertyValue('--acc').trim(), radius: root.getPropertyValue('--r').trim() };
  });
  await page.goto(`${base}/`);
  const mainFoundation = await foundation();
  await page.goto(`${base}/projects/`);
  assert.deepEqual(await foundation(), mainFoundation, 'The archive and main page must share the design foundation');
  await decodeVisible();
  assert.equal(await visible(), total);
  await page.screenshot({ path: `${output}/archive-desktop.png` });
  await page.getByRole('button', { name: `회사 ${companyCount}`, exact: true }).click();
  assert.equal(await visible(), companyCount);
  assert(new URL(page.url()).searchParams.get('category') === 'company');
  await page.getByRole('searchbox').fill('하네스');
  assert.equal(await visible(), 2); // Forge Studio and the legacy knowledge tool.
  await page.getByRole('searchbox').fill('Forge');
  assert.equal(await visible(), 1);
  await page.locator('.project-item:visible .card-link').click();
  await page.waitForURL('**/projects/forge-studio/');
  const back = page.locator('.breadcrumb [data-archive-back]');
  assert((await back.getAttribute('href')).includes('q=Forge'));
  await page.locator('.screen-link').first().click();
  assert(await page.locator('dialog').evaluate(dialog => dialog.open));
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog').evaluate(dialog => dialog.open), false);
  assert(await page.locator('.screen-link').first().evaluate(el => el === document.activeElement), 'Focus should return to image link');
  await back.click();
  assert.equal(await visible(), 1);
  assert.equal(await page.getByRole('searchbox').inputValue(), 'Forge');
  await page.getByRole('button', { name: '검색어 지우기' }).click();
  assert.equal(await visible(), companyCount);
  await page.getByRole('button', { name: '팀 프로젝트 10', exact: true }).click();
  assert.equal(await visible(), 10);
  await page.goBack();
  assert.equal(await visible(), companyCount);
  await page.getByRole('searchbox').fill('존재하지 않는 프로젝트 <script>');
  assert.equal(await visible(), 0);
  assert(await page.locator('.empty-state').isVisible());
  await page.getByRole('button', { name: '전체 프로젝트 보기' }).click();
  assert.equal(await visible(), total);
  await page.goto(`${base}/projects/?category=team&q=Flutter`);
  assert.equal(await visible(), 4);
  await page.goto(`${base}/projects/?category=invalid&q=API`);
  assert((await visible()) > 0);
  await page.goto(`${base}/projects/?q=next.js`);
  assert((await visible()) > 0);
  // Korean IME input must not be committed half-composed.
  await page.goto(`${base}/projects/`);
  await page.getByRole('searchbox').dispatchEvent('compositionstart');
  await page.getByRole('searchbox').fill('미네르바');
  await page.getByRole('searchbox').dispatchEvent('compositionend');
  assert.equal(await visible(), 1);
  console.info('Search, category intersection, empty state, URL history and gallery keyboard checks passed.');

  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width > 768 ? 1100 : 844 });
    await page.goto(`${base}/projects/`); await noOverflow();
    if (width === 390) { await decodeVisible(); await page.screenshot({ path: `${output}/archive-mobile.png`, fullPage: false }); }
    await page.goto(`${base}/projects/marblewalk/`); await noOverflow();
    if (width === 1440 || width === 390) { await page.locator('#screens').scrollIntoViewIfNeeded(); await page.evaluate(async () => { await Promise.all([...document.querySelectorAll('#screens img')].map(image => image.decode())); }); await page.evaluate(() => scrollTo(0, 0)); }
    if (width === 1440) await page.screenshot({ path: `${output}/detail-desktop.png`, fullPage: true });
    if (width === 390) await page.screenshot({ path: `${output}/detail-mobile.png`, fullPage: true });
  }
  for (const project of projects) {
    const response = await page.goto(`${base}/projects/${project.slug}/`);
    assert.equal(response.status(), 200, project.slug);
    assert.equal(await page.locator('h1').textContent(), project.title);
    await noOverflow();
  }
  // Inspect all thumbnail assets even if lazy images are below the viewport.
  const sources = [...new Set(projects.flatMap(project => project.images.map(image => image.src)))];
  for (const source of sources) {
    const response = await context.request.get(`${base}${source}`);
    assert.equal(response.status(), 200, source);
    assert(response.headers()['content-type'].startsWith('image/'));
  }
  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const staticPage = await noJs.newPage();
  await staticPage.goto(`${base}/projects/`);
  assert.equal(await staticPage.locator('.project-item:visible').count(), total);
  assert.equal(await staticPage.locator('.archive-controls').isVisible(), false);
  await staticPage.locator('a[href="/projects/teamo/"]').click();
  assert.equal(await staticPage.locator('h1').textContent(), 'Teamo');
  await noJs.close();
  await page.goto(`${base}/projects/`);
  await page.keyboard.press('Tab');
  // A direct focus check avoids inherited focus when navigating in the same context.
  await page.locator('.skip').focus();
  assert(await page.locator('.skip').evaluate(el => el.getBoundingClientRect().top >= 0));
  assert.equal(errors.length, 0, errors.join('\n'));
  const report = { projects: projects.length, pages: projects.length + 1, viewports: [320,390,768,1440], checks: ['shared-design-foundation','search','filters','query-and-category','empty-state','reset','URL-history','IME','gallery','focus-restoration','no-JavaScript','all-detail-pages','all-images','horizontal-overflow'], errors };
  await fs.writeFile(`${output}/verification.json`, JSON.stringify(report, null, 2));
  console.info(JSON.stringify(report));
} finally { await browser.close(); }

/** Check the application page, portrait, PDF download and archive handoff. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const base = process.env.PORTFOLIO_URL || 'http://127.0.0.1:4318';
const output = process.env.QA_OUTPUT || '/tmp/fakeeyes-qa';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const errors = [];
try {
  for (const width of [320,390,768,1024,1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, javaScriptEnabled: false });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto(`${base}/fakeeyes/`);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.sheet').count(),8);
    assert.equal(await page.locator('.portrait').isVisible(),true);
    assert(await page.locator('.portrait').evaluate(img => img.complete && img.naturalWidth > 0));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Overflow at ${width}`);
    assert(await page.locator('.archive-link').evaluate(el => { const r=el.getBoundingClientRect();return r.left >= 0 && r.right <= innerWidth; }));
    if (width===390 || width===1440) await page.screenshot({path:`${output}/web-${width}.png`});
    for (const id of ['reward','coupon','cms','infra','platform','forge']) {
      await page.locator(`.nav a[href="#${id}"]`).click();
      assert.equal(new URL(page.url()).hash,`#${id}`);
      assert(await page.locator(`#${id}`).evaluate(el=>el.getBoundingClientRect().top>=0), `Hidden anchor ${id}`);
    }
    const pdf=await context.request.get(`${base}/fakeeyes/choi-minseok-portfolio.pdf`);
    assert.equal(pdf.status(),200);
    assert.equal((await pdf.body()).subarray(0,5).toString(),'%PDF-');
    for (const src of await page.locator('img').evaluateAll(imgs=>imgs.map(img=>img.src))) {
      assert.equal((await context.request.get(src)).status(),200,src);
    }
    await page.locator('.archive-link').click();
    await page.waitForURL('**/projects/');
    assert.equal(await page.locator('.project-item').count(),23);
    await page.goBack();
    assert.equal(await page.locator('h1').textContent(),'최민석');
    await context.close();
  }
  assert.equal(errors.length,0,errors.join('\n'));
  const report={viewports:[320,390,768,1024,1440],sections:8,archiveProjects:23,checks:['portrait','all-section-anchors','archive-navigation-and-back','pdf-download','all-images','no-overflow','no-javascript'],errors};
  await fs.writeFile(`${output}/web-verification.json`,JSON.stringify(report,null,2));
  console.info(JSON.stringify(report));
} finally { await browser.close(); }

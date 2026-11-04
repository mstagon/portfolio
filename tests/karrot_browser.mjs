/** Verify the current-job portfolio, responsive navigation and archive handoff. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const base = process.env.PORTFOLIO_URL || 'http://127.0.0.1:4318';
const output = process.env.QA_OUTPUT || '/tmp/karrot-campaign-qa';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const errors = [];
try {
  for (const width of [320,390,768,1024,1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion:'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', r => { if (r.url().startsWith(base) && r.status()>=400) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto(`${base}/karrot/`);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('h1').textContent(),'최민석');
    assert.equal(await page.locator('.case').first().getAttribute('id'),'shell');
    assert.equal(await page.locator('.nav-archive').isVisible(),true);
    assert(await page.locator('.nav-archive').evaluate(el => { const r=el.getBoundingClientRect();return r.left>=0 && r.right<=innerWidth && r.top>=0; }));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Overflow at ${width}`);
    // Ensure each internal navigation item resolves, without external-link selector errors.
    for (const id of ['shell','admin','ads','exp','way','proj']) {
      await page.locator(`.nav-links a[href="#${id}"]`).click();
      assert.equal(new URL(page.url()).hash,`#${id}`);
      assert(await page.locator(`#${id}`).evaluate(el => el.getBoundingClientRect().top >= 0),`Heading covered at ${id}/${width}`);
    }
    const screenshots = width===390 || width===1440;
    if(screenshots) {
      await page.locator('#way').scrollIntoViewIfNeeded();
      await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('#way img')].map(i=>i.decode()));});
      await page.screenshot({path:`${output}/forge-${width}.png`});
      await page.locator('#shell').scrollIntoViewIfNeeded();
      await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('#shell img')].map(i=>i.decode()));});
      await page.screenshot({path:`${output}/minerva-${width}.png`});
      await page.evaluate(()=>scrollTo(0,0));
      await page.screenshot({path:`${output}/hero-${width}.png`});
    }
    await page.locator('.nav-archive').click();
    await page.waitForURL('**/projects/');
    assert.equal(await page.locator('.project-item').count(),23);
    await page.goBack();
    assert.equal(await page.locator('h1').textContent(),'최민석');
    await context.close();
  }
  const context = await browser.newContext({viewport:{width:390,height:844}});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${base}/karrot/`);
  await page.getByRole('link',{name:'웹 플랫폼',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.nav-links a[href="#shell"]').getAttribute('aria-current')==='true');
  await page.locator('.skip-link').focus();
  assert(await page.locator('.skip-link').evaluate(el=>el.getBoundingClientRect().top>=0));
  const allImages=await page.locator('img').evaluateAll(imgs=>imgs.map(i=>i.src));
  for(const src of allImages){const response=await context.request.get(src);assert.equal(response.status(),200,src);}
  const noJs = await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const staticPage=await noJs.newPage();
  await staticPage.goto(`${base}/karrot/`);
  assert.equal(await staticPage.locator('.case:visible').count(),6);
  assert.equal(await staticPage.locator('.nav-archive').isVisible(),true);
  await staticPage.locator('.nav-archive').click();
  assert.equal(await staticPage.locator('.project-item:visible').count(),23);
  assert.equal(errors.length,0,errors.join('\n'));
  const report={viewports:[320,390,768,1024,1440],sections:6,archiveProjects:23,checks:['campaign-target','mobile-header-link','all-section-navigation','archive-handoff-and-back','no-horizontal-overflow','motion-nav','all-images','keyboard','no-javascript'],errors};
  await fs.writeFile(`${output}/verification.json`,JSON.stringify(report,null,2));
  console.info(JSON.stringify(report));
}finally{await browser.close();}

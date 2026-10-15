// Dev-only: screenshots a page of the running dev server and reports console errors and sideways overflow.
// usage: node scripts/dev/shots.cjs <path> [name] [--quick]     e.g. node scripts/dev/shots.cjs / home
// --quick takes only the top and full-page shots with motion on (no scroll frames, no reduced-motion pass).
// Writes test-results/shots/<name>-{desktop,mobile}{,-reduced}-{top,full}.png and, for motion,
// <name>-{desktop,mobile}-scroll-NN.png along the scroll. Exits 1 on a console error or overflow.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const quick = process.argv.includes('--quick');
const route = args[0] ?? '/';
const name = args[1] ?? (route.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home');
const BASE = process.env.SHOTS_BASE ?? 'http://127.0.0.1:4322';
const OUT_DIR = path.join(__dirname, '..', '..', 'test-results', 'shots');
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, scrollStops: 8 },
  { name: 'mobile', width: 390, height: 844, scrollStops: 5 },
];
const SETTLE_MS = 2600;
const SCROLL_SETTLE_MS = 900;

const capture = async (browser, viewport, reduced) => {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(SETTLE_MS);
  const view = `${name}-${viewport.name}${reduced ? '-reduced' : ''}`;
  await page.screenshot({ path: path.join(OUT_DIR, `${view}-top.png`) });
  const scrollable = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  if (!quick && !reduced && scrollable > 0) {
    for (let stop = 1; stop <= viewport.scrollStops; stop += 1) {
      const from = await page.evaluate(() => window.scrollY);
      const to = Math.round((scrollable * stop) / viewport.scrollStops);
      for (let step = 1; step <= 12; step += 1) {
        await page.evaluate((y) => window.scrollTo(0, y), from + ((to - from) * step) / 12);
        await page.waitForTimeout(30);
      }
      await page.waitForTimeout(SCROLL_SETTLE_MS);
      await page.screenshot({ path: path.join(OUT_DIR, `${view}-scroll-${String(stop).padStart(2, '0')}.png`) });
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: path.join(OUT_DIR, `${view}-full.png`), fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await context.close();
  return { view, scrollablePx: scrollable, sidewaysOverflowPx: Math.max(0, overflow), errors };
};

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const report = [];
  for (const viewport of VIEWPORTS) {
    for (const reduced of quick ? [false] : [false, true]) report.push(await capture(browser, viewport, reduced));
  }
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.some((r) => r.errors.length > 0 || r.sidewaysOverflowPx > 0) ? 1 : 0);
})();

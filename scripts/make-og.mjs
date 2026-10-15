#!/usr/bin/env node
// Renders the 1200×630 social preview to public/og.png with the self-hosted display font, in the Blueprint look.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const WIDTH = 1200;
const HEIGHT = 630;
const STAR_COUNT = 90;
const FONT_DIR = 'node_modules/@fontsource-variable/inter-tight/files';
const OUT = 'public/og.png';

const fontFile = (await readdir(FONT_DIR)).find((f) => f.includes('latin-wght-normal') && f.endsWith('.woff2'));
if (!fontFile) throw new Error(`No latin Inter Tight woff2 in ${FONT_DIR}`);
const font = (await readFile(path.join(FONT_DIR, fontFile))).toString('base64');

// Blueprint: near-black, white and grey type, and one blue family for the light (a halftone glow and stars).
const html = `<!doctype html><html><head><style>
@font-face{font-family:IT;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:300 800}
*{margin:0;box-sizing:border-box}
body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;position:relative;color:#f4f5f7;font-family:IT,sans-serif;background:#050506}
.glow{position:absolute;right:-140px;bottom:-200px;width:760px;height:620px;
background:radial-gradient(closest-side,#e6f4ff,#7fd4ff 18%,#2f6bff 46%,rgba(11,42,102,.6) 74%,transparent);
-webkit-mask:radial-gradient(circle,#000 2.2px,transparent 2.7px) 0 0/7px 7px;mask:radial-gradient(circle,#000 2.2px,transparent 2.7px) 0 0/7px 7px}
canvas{position:absolute;inset:0}
.t{position:relative;padding:0 96px;height:100%;display:flex;flex-direction:column;justify-content:center}
.k{display:inline-flex;align-items:center;gap:12px;align-self:flex-start;padding:10px 18px;border-radius:999px;font-size:21px;color:#b6bcc8;
background:rgba(255,255,255,.045);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}
.k i{width:9px;height:9px;border-radius:50%;background:#4c9dff;box-shadow:0 0 14px #4c9dff}
h1{font-size:96px;font-weight:540;letter-spacing:-3.4px;line-height:1;margin:34px 0 14px}
.r{font-size:46px;font-weight:500;letter-spacing:-1px;color:rgba(244,245,247,.66)}
.u{margin-top:40px;font-size:22px;color:#8b93a3}
</style></head><body><div class="glow"></div><canvas id="c" width="${WIDTH}" height="${HEIGHT}"></canvas>
<div class="t"><div class="k"><i></i>KONA Software Lab, Dhaka</div><h1>Zakaria Hossain Foysal</h1>
<div class="r">Senior Software Engineer</div><div class="u">xack20.github.io</div></div>
<script>
let a=7;const r=()=>{a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};
const c=document.getElementById('c').getContext('2d');
for(let i=0;i<${STAR_COUNT};i++){const x=r()*${WIDTH},y=r()*${HEIGHT},s=r()*1.3+.4;c.fillStyle='rgba(230,244,255,'+(.25+r()*.6)+')';c.beginPath();c.arc(x,y,s,0,7);c.fill()}
</script></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: OUT });
await browser.close();
console.log(`Wrote ${OUT}`);

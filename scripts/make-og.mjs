#!/usr/bin/env node
// Renders the 1200×630 social preview to public/og.png with the self-hosted display font.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const WIDTH = 1200;
const HEIGHT = 630;
const STAR_COUNT = 70;
const FONT_DIR = 'node_modules/@fontsource-variable/space-grotesk/files';
const OUT = 'public/og.png';

const fontFile = (await readdir(FONT_DIR)).find((f) => f.includes('latin-wght-normal') && f.endsWith('.woff2'));
if (!fontFile) throw new Error(`No latin Space Grotesk woff2 in ${FONT_DIR}`);
const font = (await readFile(path.join(FONT_DIR, fontFile))).toString('base64');

const html = `<!doctype html><html><head><style>
@font-face{font-family:SG;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:300 700}
*{margin:0;box-sizing:border-box}
body{width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;position:relative;color:#f3f1ea;font-family:SG,sans-serif;
background:radial-gradient(ellipse at 60% 40%,#101a33,#070a14 70%)}
canvas{position:absolute;inset:0}
.t{position:relative;padding:0 90px;height:100%;display:flex;flex-direction:column;justify-content:center}
.k{font-size:22px;letter-spacing:6px;color:#e8c478;text-transform:uppercase;font-weight:500}
h1{font-size:92px;font-weight:300;letter-spacing:-3px;line-height:1;margin:26px 0}
b{font-weight:600;color:#e8c478}
.u{font-size:24px;color:rgba(243,241,234,.7)}
</style></head><body><canvas id="c" width="${WIDTH}" height="${HEIGHT}"></canvas>
<div class="t"><div class="k">Zakaria Hossain Foysal</div><h1>Engineering <b>trust</b><br>into AI agents</h1>
<div class="u">Senior Software Engineer · xack20.github.io</div></div>
<script>
let a=7;const r=()=>{a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};
const c=document.getElementById('c').getContext('2d');const s=Array.from({length:${STAR_COUNT}},()=>({x:r()*${WIDTH},y:r()*${HEIGHT},r:r()*1.6+.6}));
for(let i=0;i<s.length;i++)for(let j=i+1;j<s.length;j++){const d=Math.hypot(s[i].x-s[j].x,s[i].y-s[j].y);if(d<150){c.strokeStyle='rgba(232,196,120,'+(1-d/150)*.3+')';c.beginPath();c.moveTo(s[i].x,s[i].y);c.lineTo(s[j].x,s[j].y);c.stroke()}}
s.forEach(p=>{c.fillStyle='rgba(232,196,120,.85)';c.beginPath();c.arc(p.x,p.y,p.r,0,7);c.fill()});
</script></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: OUT });
await browser.close();
console.log(`Wrote ${OUT}`);

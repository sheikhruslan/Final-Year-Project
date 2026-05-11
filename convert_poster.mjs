import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const HTML_FILE = path.resolve(__dirname, 'FYP_Research_Poster.html');
const PDF_OUT   = path.resolve(__dirname, 'FYP_Research_Poster_A3.pdf');
const PNG_OUT   = path.resolve(__dirname, 'FYP_Research_Poster_A3.png');

// Poster CSS dimensions (A3 at 96dpi)
const POSTER_W = 1122;
const POSTER_H = 1587;

// A3 portrait at 72dpi = 842 × 1191 px
// deviceScaleFactor = target_px / css_px  =>  842/1122 ≈ 0.75
// physical screenshot = CSS px × DPR  =>  1122×0.75=842, 1587×0.75=1190 ≈1191
const DPR = 842 / POSTER_W;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // ── PDF ──────────────────────────────────────────────
  console.log('Generating PDF...');
  const pdfPage = await browser.newPage();
  await pdfPage.goto(`file:///${HTML_FILE.replace(/\\/g, '/')}`, { waitUntil: 'networkidle2', timeout: 30000 });
  await pdfPage.addStyleTag({ content: 'body { padding: 0 !important; background: #fff !important; }' });
  await pdfPage.pdf({
    path: PDF_OUT,
    width:  '297mm',
    height: '420mm',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  console.log(`PDF saved → ${PDF_OUT}`);
  await pdfPage.close();

  // ── PNG ──────────────────────────────────────────────
  console.log('Generating PNG...');
  const pngPage = await browser.newPage();

  // Viewport = poster CSS size; DPR scales it down to 842×~1190 physical pixels
  await pngPage.setViewport({
    width:  POSTER_W,
    height: POSTER_H,
    deviceScaleFactor: DPR,
  });

  await pngPage.goto(`file:///${HTML_FILE.replace(/\\/g, '/')}`, { waitUntil: 'networkidle2', timeout: 30000 });
  await pngPage.addStyleTag({ content: 'body { padding: 0 !important; background: #fff !important; }' });

  // Screenshot just the .poster element — auto-clips to its bounds
  const posterEl = await pngPage.$('.poster');
  await posterEl.screenshot({ path: PNG_OUT, type: 'png' });

  const { width, height } = await posterEl.boundingBox();
  console.log(`PNG saved → ${PNG_OUT}  (CSS ${width}×${height}  →  physical ~${Math.round(width*DPR)}×${Math.round(height*DPR)} px)`);
  await pngPage.close();

  await browser.close();
  console.log('Done.');
})().catch(err => { console.error(err); process.exit(1); });

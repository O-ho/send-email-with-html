'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const PDFDocument = require('pdfkit');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// 크롬 인쇄 엔진으로 페이지 네이션
async function renderHtmlToPdfBuffer(html) {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('print');

    return await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      format: 'A4',
      margin: {
        top: '8mm',
        right: '8mm',
        bottom: '8mm',
        left: '8mm',
      },
    });
  } finally {
    await browser.close();
  }
}
// 페이지별로 png 이미지 파일로 변환
function renderPdfToPagePngs(plainPdfBuffer) {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'secure-report-'));
  const pdfPath = path.join(tmpRoot, 'plain.pdf');
  const outDir = path.join(tmpRoot, 'pages');
  fs.mkdirSync(outDir);
  fs.writeFileSync(pdfPath, plainPdfBuffer);

  const py = `
import fitz
import pathlib
import sys

pdf_path = pathlib.Path(sys.argv[1])
out_dir = pathlib.Path(sys.argv[2])
out_dir = pathlib.Path(sys.argv[2])
dpi = int(sys.argv[3])

doc = fitz.open(str(pdf_path))
for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=dpi, alpha=False)
    pix.save(str(out_dir / f"page-{i+1:03d}.png"))
print(len(doc))
`;

  const result = spawnSync('python3', ['-c', py, pdfPath, outDir, '170'], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(
      `[pdf] failed to rasterize pages with PyMuPDF: ${result.stderr || result.stdout || 'unknown error'}`
    );
  }

  const files = fs
    .readdirSync(outDir)
    .filter((name) => name.endsWith('.png'))
    .sort((a, b) => a.localeCompare(b));
  if (!files.length) {
    throw new Error('[pdf] no rasterized pages generated');
  }

  const pngBuffers = files.map((name) => fs.readFileSync(path.join(outDir, name)));
  fs.rmSync(tmpRoot, { recursive: true, force: true });
  return pngBuffers;
}

// png로 만든 이미지들을 다시 묶어서 pdf로 변환
async function renderReportPdfBuffer(params) {
  const { html, password } = params;
  if (!html || !password) {
    throw new Error('[pdf] html/password is required');
  }

  const plainPdfBuffer = await renderHtmlToPdfBuffer(html);
  const pagePngs = renderPdfToPagePngs(plainPdfBuffer);

  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    userPassword: password,
    ownerPassword: `${password}-owner`,
    permissions: {
      printing: 'highResolution',
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: false,
      contentAccessibility: true,
      documentAssembly: false,
    },
  });

  const buffers = [];
  doc.on('data', (chunk) => buffers.push(chunk));

  pagePngs.forEach((png, index) => {
    if (index > 0) {
      doc.addPage();
    }
    doc.image(png, 0, 0, {
      fit: [doc.page.width, doc.page.height],
      align: 'center',
      valign: 'center',
    });
  });

  doc.end();

  return await new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
  });
}

module.exports = {
  renderReportPdfBuffer,
};

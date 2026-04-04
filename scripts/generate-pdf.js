const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
  });
  const page = await browser.newPage();

  const htmlPath = path.resolve(__dirname, 'flyers/dossier_depute_4p.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  const outPath = path.resolve(__dirname, 'flyers/dossier_depute_4p.pdf');
  await page.pdf({
    path: outPath,
    format: 'A4',
    margin: { top: '18mm', bottom: '18mm', left: '20mm', right: '20mm' },
    printBackground: true,
  });

  console.log(`PDF generated: ${outPath}`);
  await browser.close();
})();

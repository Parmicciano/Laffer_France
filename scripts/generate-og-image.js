#!/usr/bin/env node
// Generate OG image using puppeteer (headless Chrome)
// Usage: npx puppeteer browsers install chrome && node scripts/generate-og-image.js
// Or: open scripts/generate-og-image.html in a browser, screenshot at 1200x630

const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630 });
  await page.goto(`file://${path.join(__dirname, 'generate-og-image.html')}`);
  await page.screenshot({
    path: path.join(__dirname, '..', 'public', 'og-image.png'),
    type: 'png',
  });
  await browser.close();
  console.log('OG image generated: public/og-image.png');
})();

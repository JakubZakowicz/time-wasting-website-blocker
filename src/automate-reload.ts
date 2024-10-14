import puppeteer from 'puppeteer';
import path from 'path';

const pathToExtension = path.join(__dirname, '..', 'dist');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    defaultViewport: null,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });

  const page = await browser.newPage();
  await page.goto('https://www.gamesradar.com/far-cry-6-best-gear-builds/');

  const workerTarget = await browser.waitForTarget(
    target =>
      target.type() === 'service_worker' &&
      target.url().endsWith('background.js')
  );

  await workerTarget.worker();
})();

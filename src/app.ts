/**
 * The following lines intialize dotenv,
 * so that env vars from the .env file are present in process.env
 */
import * as dotenv from 'dotenv';
import puppeteer, { Browser, Page } from 'puppeteer';
import { writeFileSync } from 'fs';

dotenv.config();

(async () => {
  const targetUrl = process.env.TARGET_URL;

  if (!targetUrl) {
    console.error("\x1b[31mNo URL provided. Exiting script.\x1b[0m"); // Red text for error
    process.exit(1);
  }

  console.log("\x1b[34mStarting Puppeteer...\x1b[0m"); // Blue text for startup info

  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page: Page = await browser.newPage();

    // Enable request interception
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      request.continue();
    });

    let m3u8Url: string | null = null;

    // Log network responses
    page.on('request', async (response) => {
      const url = response.url();
      if (url.endsWith('.m3u8')) {
        m3u8Url = url;
        console.log("\x1b[32mFound .m3u8 URL:\x1b[0m", url); // Green text for found URL
        // Save the first .m3u8 URL to file
        writeFileSync('puppeteer_output.txt', url);
        // Close browser early since we only need one URL
        console.log("\x1b[32m✅ First .m3u8 URL saved. Exiting...\x1b[0m");
        if (browser) await browser.close();
        process.exit(0); // Exit script after saving the URL
      }
    });

    console.log("\x1b[34mNavigating to page:\x1b[0m", targetUrl);
    await page.goto(targetUrl, { waitUntil: 'networkidle2' });

    // Replace waitForTimeout with a delay using setTimeout
    await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 10 seconds

    console.log("\x1b[34mAll network responses:\x1b[0m", m3u8Url);

    // Save results to file for reference
    if (!m3u8Url) {
      console.log("\x1b[33m⚠️ No .m3u8 URL found.\x1b[0m"); // Yellow warning for no results
      writeFileSync('puppeteer_output.txt', 'No .m3u8 URL found.');
    }

  } catch (error) {
    console.error("\x1b[31mError navigating to page or during execution:\x1b[0m", error); // Red text for errors
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();

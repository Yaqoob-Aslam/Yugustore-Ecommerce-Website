import { test, expect, chromium } from '@playwright/test';

test.describe.serial('Yugustore Clothing Brand', () => {
  let browser, context, page;
  const BASE_URL = 'https://www.yugustore.com/collections/all';

  // Scroll to footer helper
  async function scrollToFooter(page) {
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1200);
  }

  // Click link → wait navigation → validate heading → go back
  async function clickAndReturn(page, locator, headingName = null) {
    await Promise.all([
      locator.click(),
      page.waitForLoadState('domcontentloaded')
    ]);

    if (headingName) {
      await expect(page.getByRole('heading', { name: headingName })).toBeVisible();
    }

    await Promise.all([
      page.goBack(),
      page.waitForLoadState('domcontentloaded')
    ]);

    await page.waitForTimeout(500);
  }

  // ------------------------
  // BEFORE ALL
  // ------------------------
  test.beforeAll(async () => {
    browser = await chromium.launch({
      headless: false,
      args: ['--start-maximized'],
      slowMo: 200
    });

    context = await browser.newContext({
      viewport: null,
      deviceScaleFactor: undefined,
      ignoreHTTPSErrors: true,
      javaScriptEnabled: true
    });

    page = await context.newPage();
  });

  // ------------------------
  // MAIN TEST
  // ------------------------
  test('Verify Footer Page Elements', async () => {
    test.setTimeout(180000);

    // Visit Base URL
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Scroll to footer initially
    await scrollToFooter(page);

    // -----------------------------------------------------
    // Instagram
    // -----------------------------------------------------
    {
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        page.getByRole('link', { name: 'instagram' }).click()
      ]);

      await newPage.waitForLoadState('domcontentloaded');
      await newPage.close();
      await scrollToFooter(page);
    }

    // -----------------------------------------------------
    // TikTok
    // -----------------------------------------------------
    {
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        page.getByRole('link', { name: 'tiktok' }).click()
      ]);

      await newPage.waitForLoadState('domcontentloaded');
      await newPage.close();
      await scrollToFooter(page);
    }

    // -----------------------------------------------------
    // Threads
    // -----------------------------------------------------
    {
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        page.getByRole('link', { name: 'threads' }).click()
      ]);

      await newPage.waitForLoadState('domcontentloaded');
      await newPage.close();
      await scrollToFooter(page);
    }

    // -----------------------------------------------------
    // Footer Internal Links (Same Tab)
    // -----------------------------------------------------

    await clickAndReturn(
      page,
      page.getByRole('link', { name: 'International shipping' })
    );

    await clickAndReturn(
      page,
      page.getByRole('link', { name: 'Career' })
    );

    await clickAndReturn(
      page,
      page.getByRole('link', { name: 'Privacy Policy' })
    );

    await clickAndReturn(
      page,
      page.getByRole('link', { name: 'Terms and Condition' })
    );

    await clickAndReturn(
      page,
      page.getByRole('link', { name: 'Cookies Policy' })
    );
  });

  // ------------------------
  // AFTER ALL
  // ------------------------
  test.afterAll(async () => {
    await page.pause();
  });
});

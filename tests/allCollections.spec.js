import { test, expect, chromium } from '@playwright/test';

test.describe.serial('Yugustore Clothing Brand', () => {
  let browser, context, page;
  const BASE_URL = 'https://www.yugustore.com/collections/all';

  test.beforeAll(async () => {
    browser = await chromium.launch({
      headless: false,
      args: ['--start-maximized'],
      slowMo: 200, // slows down actions for stability
    });
    context = await browser.newContext({viewport: null,deviceScaleFactor: undefined,ignoreHTTPSErrors: true,javaScriptEnabled: true});
    page = await context.newPage();
  });

  test('Navigate to Yugustore All Collections Page', async () => {

        // Step 1: Navigate to base URL with strong reliability
        try {
          await page.goto(BASE_URL, {
            waitUntil: 'commit', // Only wait for first response (fastest safe option)
            timeout: 250000, // 5-minute safety timeout for slow sites
          });

          try {
            await page.waitForLoadState('domcontentloaded', { timeout: 120000 });
          } catch (err) {
            console.warn('domcontentloaded already fired or page is SPA, skipping...', err.message);
          }

          // ✅ Step 4: Verify correct URL is loaded
          await expect(page).toHaveURL(/collections\/all/, { timeout: 60000 });

        } catch (error) {
          console.error(`❌ Navigation to ${BASE_URL} failed: ${error.message}`);

          // 🔁 Retry logic for flaky or slow network behavior
          console.log('🔁 Retrying navigation...');

          await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 180000 });

          // Wait for main section and dynamic content again
          await page.locator('main').waitFor({ state: 'visible', timeout: 180000 });
        }

        const asuraLink = page.getByRole('link', { name: 'ASURA' }).first();
        await asuraLink.waitFor({ state: 'visible', timeout: 120000 });
        await expect(asuraLink).toBeEnabled();

        // Click with navigation stabilization
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 180000 }),
          asuraLink.click(),
        ]);

        // ✅ Robust dynamic wait for <main> (handles re-render or detachment)
        await page.waitForFunction(() => {
          const main = document.querySelector('main');
          return main && main.offsetHeight > 200 && main.offsetWidth > 200;
        }, { timeout: 180000 });

        await expect(page).not.toHaveURL(BASE_URL);

        // ✅ Try navigating back safely
        const response = await Promise.race([
          page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => null),
          page.waitForTimeout(5000) // fallback if goBack doesn't trigger navigation
        ]);

        await page.waitForSelector('main', { state: 'visible', timeout: 120000 });
        await expect(page).toHaveURL(BASE_URL);

        // Wait for product visibility with very high timeout
        await expect(page.getByText('Leather Boho Stud Bag Burgundy')).toBeVisible({ timeout: 120000 });
        await expect(page.getByText('£').nth(2)).toBeVisible({ timeout: 120000 });

        // 1️⃣ Define the locator
        const quickAddButton = page.getByRole('button', { name: 'Quick Add' }).first();

        // 2️⃣ Wait for it to be visible and enabled
        await quickAddButton.waitFor({
          state: 'visible', // ensures it's rendered
          timeout: 10000
        });

        // 3️⃣ Scroll into view safely
        try {
          await quickAddButton.scrollIntoViewIfNeeded();
        } catch (err) {
          console.warn('scrollIntoViewIfNeeded failed, trying JS scroll...', err);
          // fallback: scroll via JS
          await page.evaluate(el => el.scrollIntoView({ behavior: 'auto', block: 'center' }), await quickAddButton.elementHandle());
        }
       await quickAddButton.click();
  });
  
  test.skip("Check OUT Modal Functionality", async () => {

    // Wait until checkout button is visible and stable
    const checkoutBtn = page.getByRole('button', { name: 'Check out' });
    await checkoutBtn.waitFor({ state: 'visible', timeout: 60000 });
    await checkoutBtn.click();

    // Wait for email textbox to appear (indicates form loaded)
    const emailField = page.getByRole('textbox', { name: 'Email' });
    await emailField.waitFor({ state: 'visible', timeout: 60000 });
    await emailField.click();
    await emailField.fill('test@gmail.com');

    const firstName = page.getByRole('textbox', { name: 'First name' });
    await firstName.waitFor({ state: 'visible', timeout: 30000 });
    await firstName.fill('Test');

    const lastName = page.getByRole('textbox', { name: 'Last name' });
    await lastName.waitFor({ state: 'visible', timeout: 30000 });
    await lastName.fill('Engineer');

    const address = page.getByRole('combobox', { name: 'Address' });
    await address.waitFor({ state: 'visible', timeout: 30000 });
    await address.fill('UK');

    const apartment = page.getByRole('textbox', { name: 'Apartment, suite, etc.' });
    await apartment.waitFor({ state: 'visible', timeout: 30000 });
    await apartment.fill('85 City Road');

    const city = page.getByRole('textbox', { name: 'City' });
    await city.waitFor({ state: 'visible', timeout: 30000 });
    await city.fill('London');

    const postcode = page.getByRole('textbox', { name: 'Postcode' });
    await postcode.waitFor({ state: 'visible', timeout: 30000 });
    await postcode.fill('SW45Ja');

    // Smooth scroll to bring payment section into view
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(1000); // short wait for elements to render

    const phoneInput = page.getByPlaceholder('Phone', { exact: true });
    await phoneInput.waitFor({ state: 'visible', timeout: 30000 });
    await phoneInput.click();
    await phoneInput.fill('+44 3001234567');

    // ===== Payment Section (Iframe Handling) =====
    await page.waitForSelector('iframe[title="Field container for: Card number"]', { state: 'attached', timeout: 60000 });

    // Now safely get the iframe locator
    const cardNumberIframe = page.frameLocator('iframe[title="Field container for: Card number"]');
    const cardInput = cardNumberIframe.getByRole('textbox', { name: 'Card number' });

    // Wait for card input visibility and fill
    await cardInput.waitFor({ state: 'visible', timeout: 30000 });
    await cardInput.fill('4111111111111111');

    // ===== Wait for Expiry iframe =====
    await page.waitForSelector('iframe[title="Field container for: Expiration date (MM / YY)"]', { state: 'attached', timeout: 60000 });
    const expiryInputField = page
      .frameLocator('iframe[title="Field container for: Expiration date (MM / YY)"]')
      .getByRole('textbox', { name: 'Expiration date (MM / YY)' });
    await expiryInputField.waitFor({ state: 'visible', timeout: 30000 });
    await expiryInputField.fill('12/25');

    // ===== Wait for CVC iframe =====
    await page.waitForSelector('iframe[title="Field container for: Security code"]', { state: 'attached', timeout: 60000 });
    const cvcInput = page.frameLocator('iframe[title="Field container for: Security code"]').getByRole('textbox', { name: 'Security code' });
    await cvcInput.waitFor({ state: 'visible', timeout: 30000 });
    await cvcInput.fill('123');

     // ===== Wait for Name on Card iframe =====
    await page.waitForSelector('iframe[title="Field container for: Name on card"]', { state: 'attached', timeout: 60000 });
    const NameonCardInput = page.frameLocator('iframe[title="Field container for: Name on card"]').getByRole('textbox', { name: 'Name on card' });
    await NameonCardInput.waitFor({ state: 'visible', timeout: 30000 });
    await NameonCardInput.fill('John Doe');


    await page.getByRole('textbox', { name: 'Mobile phone number' }).click();
    await page.getByRole('textbox', { name: 'Mobile phone number' }).fill('+44 3001234567');
    

    // Wait for Pay Now button and click
    const payNow = page.getByRole('button', { name: 'Pay now' });
    await payNow.waitFor({ state: 'visible', timeout: 30000 });
    await payNow.click();

      // Optional: wait for a success or redirect state
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 });
});

  test.afterAll(async () => {
    await page.pause();
    // await page.close();
  });
});
const { test, expect, chromium } = require('@playwright/test');
import { ProductActions } from './yugustore-products.js';

test.describe.serial('Yugustore Clothing Brand', () => {
  let browser, context, page;
  let productActions;

  test.beforeAll(async () => {
    browser = await chromium.launch({
      headless: false,
      args: ['--start-maximized'],
      slowMo: 500,
    });
    context = await browser.newContext({
      viewport: null,
      deviceScaleFactor: undefined,
      ignoreHTTPSErrors: true,
      javaScriptEnabled: true
    });
    page = await context.newPage();
    productActions = new ProductActions();
  });

  test('Process all products with individual checkout flow WITH PAGINATION', async () => {
    test.setTimeout(999000000); // ✅ Increased timeout for multiple pages (20 minutes)
    console.log('🎯 STARTING: All Products Individual Checkout Automation WITH PAGINATION');
    console.log('========================================================================');
    
    // ✅ Process all products with pagination
    const results = await productActions.processAllProductsWithIndividualCheckout(page);
    console.log('\n🏁 AUTOMATION FINISHED ACROSS ALL PAGES!');
  });

  test('Add single product and checkout from shopping modal', async () => {
    test.setTimeout(180000);

    const checkoutResult = await productActions.addSingleProductAndCheckout(page);
    if (checkoutResult === 'checkout_completed') {
      console.log('🎉 SUCCESS: Single product added and checkout completed!');
    } else {
      console.log(`❌ Checkout result: ${checkoutResult}`);
    }
  });

  test.afterAll(async () => {
    await page.pause(); 
    // await browser.close();
  });
});
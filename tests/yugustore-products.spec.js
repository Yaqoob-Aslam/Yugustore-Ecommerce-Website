const { test, expect, chromium } = require('@playwright/test');
import { ProductActions } from './yugustore-products.js';

test.describe.serial('Yugustore Clothing Brand', () => {
  let browser, context, page;
  let productActions;

  test.beforeAll(async () => {
    browser = await chromium.launch({
      headless: false,
      args: ['--start-maximized'],
      slowMo: 500, // ✅ Increased for better visibility
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

  test('Process all products with individual checkout flow', async () => {
    test.setTimeout(9000000); // ✅ Increased timeout for all products
    console.log('🎯 STARTING: All Products Individual Checkout Automation');
    console.log('======================================================');
    // ✅ Process all products with individual checkout
    const results = await productActions.processAllProductsWithIndividualCheckout(page);
    console.log('\n🏁 AUTOMATION FINISHED!');
  });

  test('Add single product and checkout from shopping modal', async () => {
    test.setTimeout(1800000); // ✅ Timeout for complete flow

    // ✅ Single product add and checkout
    const checkoutResult = await productActions.addSingleProductAndCheckout(page);
    if (checkoutResult.includes('checkout_completed')) {
      console.log('🎉 SUCCESS: Single product added and checkout completed!');
    } else {
      console.log(`❌ Checkout result: ${checkoutResult}`);
    }
  });

  test.afterAll(async () => {
    // await page.pause(); 
    await browser.close();
  });
});
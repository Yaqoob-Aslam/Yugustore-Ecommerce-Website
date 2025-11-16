import { expect } from '@playwright/test';

export class ProductActions {
  async addToCart(productCard) {
    try {
      console.log('🔍 Looking for cart buttons...');

      // ✅ ALL POSSIBLE BUTTON SELECTORS
      const buttonSelectors = [
        // Quick Add buttons
        'button:has-text("Quick Add")',
        'button.m-button--white:has-text("Quick Add")',
        'button.m-button--secondary:has-text("Quick Add")',

        // Select Options buttons (including span text)
        'button:has-text("Select options")',
        'button:has-text("Select Options")',
        'button:has-text("Select option")',
        'button:has-text("SELECT OPTIONS")',
        'button:has(span:has-text("Select options"))',
        'button:has(span:has-text("Select Options"))',

        // Add to Cart buttons
        'button[aria-label="Add to cart"]',
        'button:has-text("Add to cart")',
        'button:has-text("Add to Cart")',
        'button:has-text("ADD TO CART")',

        // General cart buttons
        '.add-to-cart',
        '.product-add-to-cart',
        '[data-add-to-cart]',
        'button[type="submit"]',

        // Specific class-based buttons
        '.m-button:has-text("Add")',
        '.product-form__cart-button',
        '.shopify-payment-button'
      ];

      // Try each selector with visibility check
      for (const selector of buttonSelectors) {
        try {
          const button = productCard.locator(selector).first();
          if (await button.isVisible({ timeout: 5000 })) {
            const buttonText = await button.textContent() || await button.getAttribute('aria-label') || selector;
            console.log(`✅ Found button: ${buttonText.trim()}`);

            await button.click();
            console.log(`🖱️ Clicked: ${buttonText.trim()}`);

            return this.getButtonType(selector, buttonText);
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // ✅ FALLBACK: Try to find any button in the product card (EXCLUDE WISHLIST)
      console.log('🔄 Trying fallback: any non-wishlist button in product card...');
      const allButtons = productCard.locator('button');
      const buttonCount = await allButtons.count();

      console.log(`🔍 Found ${buttonCount} total buttons in product card`);

      for (let i = 0; i < buttonCount; i++) {
        const button = allButtons.nth(i);
        if (await button.isVisible({ timeout: 3000 })) {
          const buttonText = await button.textContent() || await button.getAttribute('aria-label') || 'Unknown Button';
          console.log(`🔍 Button ${i + 1}: "${buttonText.trim()}"`);

          // ✅ SKIP WISHLIST BUTTONS
          if (this.isWishlistButton(buttonText)) {
            console.log(`⏭️ Skipping wishlist button: ${buttonText.trim()}`);
            continue;
          }

          // Check if it's a cart-related button
          if (this.isCartButton(buttonText)) {
            await button.click();
            console.log(`🖱️ Clicked fallback button: "${buttonText.trim()}"`);
            return this.getButtonType('fallback', buttonText);
          }
        }
      }

      console.log('❌ No cart buttons found with any selector');

      // ✅ DEBUG: Print all available buttons for troubleshooting
      console.log('🐛 DEBUG: All buttons in product card:');
      for (let i = 0; i < buttonCount; i++) {
        const button = allButtons.nth(i);
        const buttonText = await button.textContent() || await button.getAttribute('aria-label') || 'No text';
        const isVisible = await button.isVisible().catch(() => false);
        console.log(`  ${i + 1}. "${buttonText.trim()}" - Visible: ${isVisible}`);
      }

      return 'no_button_found';

    } catch (error) {
      console.log('❌ Error in addToCart:', error.message);
      return 'error_occurred';
    }
  }

  // ✅ Helper method to determine button type
  getButtonType(selector, buttonText) {
    const text = buttonText.toLowerCase().trim();

    if (text.includes('quick add')) {
      return 'quick_add';
    } else if (text.includes('select option')) {
      return 'select_options';
    } else if (text.includes('add to cart')) {
      return 'add_to_cart';
    } else if (selector.includes('m-button--white')) {
      return 'quick_add_white';
    } else if (selector.includes('m-button--secondary')) {
      return 'quick_add_secondary';
    } else {
      return `button_${text.replace(/\s+/g, '_')}`;
    }
  }

  // ✅ Helper method to check if button is cart-related
  isCartButton(buttonText) {
    if (!buttonText) return false;

    const text = buttonText.toLowerCase().trim();
    const cartKeywords = [
      'add', 'cart', 'buy', 'shop', 'purchase',
      'quick', 'select', 'option', 'order', 'shop now'
    ];

    return cartKeywords.some(keyword => text.includes(keyword));
  }

  // ✅ NEW: Helper method to identify and skip wishlist buttons
  isWishlistButton(buttonText) {
    if (!buttonText) return false;

    const text = buttonText.toLowerCase().trim();
    const wishlistKeywords = [
      'wishlist', 'wish', 'heart', 'like', 'save', 'favorite'
    ];

    return wishlistKeywords.some(keyword => text.includes(keyword));
  }

  // ✅ NEW: Safe wait method to handle page closure
  async safeWait(page, milliseconds) {
    try {
      if (page && !page.isClosed()) {
        await page.waitForTimeout(milliseconds);
      }
    } catch (error) {
      console.log('⚠️ Safe wait interrupted:', error.message);
    }
  }

  // ✅ NEW: Method to select first available variant
  async selectFirstVariant(modalContext) {
    try {
      console.log('🔄 Looking for variant selectors...');
      
      const variantSelectors = [
        'select[class*="variant"]',
        'select[name*="variant"]',
        '.variant-selector select',
        '.product-options select',
        'input[type="radio"][name*="variant"]',
        '.swatch input[type="radio"]'
      ];
      
      for (const selector of variantSelectors) {
        try {
          const variantInput = modalContext.locator(selector).first();
          if (await variantInput.isVisible({ timeout: 3000 })) {
            console.log(`✅ Found variant selector: ${selector}`);
            
            if (selector.includes('select')) {
              // Handle dropdown select
              await variantInput.selectOption({ index: 1 }); // Select first option
              console.log('✅ Selected first variant from dropdown');
            } else if (selector.includes('input[type="radio"]')) {
              // Handle radio buttons
              const firstRadio = modalContext.locator(selector).first();
              await firstRadio.check();
              console.log('✅ Selected first variant radio button');
            }
            
            await this.safeWait(modalContext.page(), 2000);
            return true;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      console.log('ℹ️ No variant selectors found');
      return false;
      
    } catch (error) {
      console.log('❌ Error selecting variant:', error.message);
      return false;
    }
  }

  // ✅ NEW: Handle case when Select Options redirects to product page
  async handleProductPageFlow(page) {
    try {
      console.log('🔄 Handling product page flow...');
      
      // Wait for product page to load
      await page.waitForSelector('.product-form, [data-product-handle]', { timeout: 10000 });
      
      console.log('🛒 Looking for Add to Cart button on product page...');
      
      const productPageAddToCartSelectors = [
        'button:has-text("Add to cart")',
        'button:has-text("Add to Cart")',
        'button:has-text("ADD TO CART")',
        '[type="submit"][name="add"]',
        '.product-form__cart-button',
        '.add-to-cart'
      ];
      
      for (const selector of productPageAddToCartSelectors) {
        try {
          const addToCartBtn = page.locator(selector).first();
          if (await addToCartBtn.isVisible({ timeout: 5000 })) {
            const buttonText = await addToCartBtn.textContent() || await addToCartBtn.getAttribute('aria-label') || selector;
            console.log(`✅ Found Add to Cart button on product page: "${buttonText.trim()}"`);
            
            // Check if variants need to be selected
            const isEnabled = await addToCartBtn.isEnabled();
            if (!isEnabled) {
              console.log('⚠️ Add to Cart button is disabled, selecting first variant...');
              await this.selectFirstVariant(page);
              await this.safeWait(page, 2000);
            }
            
            await addToCartBtn.click({ timeout: 15000 });
            console.log(`🖱️ Clicked Add to Cart on product page`);
            
            // Wait and go back to products page
            await this.safeWait(page, 5000);
            await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForSelector('.m-product-card', { timeout: 15000 });
            
            return 'select_options_completed';
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      console.log('❌ Could not find Add to Cart button on product page');
      return 'select_options_failed';
      
    } catch (error) {
      console.log('❌ Error in product page flow:', error.message);
      return 'select_options_failed';
    }
  }

  // ✅ FIXED: Handle Select Options variant selection with proper modal detection
  async handleSelectOptionsFlow(page) {
    try {
      console.log('🔄 Handling Select Options flow...');
      
      // Wait for the actual product modal to appear
      console.log('⏳ Waiting for product variant modal...');
      await this.safeWait(page, 5000);
      
      // ✅ IMPROVED: More specific modal selectors for product modals
      const productModalSelectors = [
        '.m-quick-shop-modal',
        '.product-modal',
        '[data-product-modal]',
        '.m-modal--product',
        '.quick-shop-modal',
        '.m-modal.m-open-modal', // Only open modals
        '.modal--quick-shop',
        '[data-modal="product"]'
      ];
      
      let productModal = null;
      let modalFound = false;
      
      // Find the actual product modal
      for (const selector of productModalSelectors) {
        try {
          const modal = page.locator(selector).first();
          if (await modal.isVisible({ timeout: 8000 })) {
            console.log(`✅ Product modal found: ${selector}`);
            productModal = modal;
            modalFound = true;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!modalFound) {
        console.log('❌ No product modal found, trying to find any open modal...');
        // Fallback: look for any open modal
        const openModals = page.locator('.m-modal.m-open-modal, .modal--open, [aria-modal="true"]');
        const modalCount = await openModals.count();
        if (modalCount > 0) {
          productModal = openModals.first();
          console.log('✅ Found open modal');
          modalFound = true;
        }
      }
      
      if (!modalFound) {
        console.log('❌ No modal detected at all, checking if we are on product page...');
        // Maybe it redirected to product page instead of opening modal
        if (page.url().includes('/products/')) {
          console.log('✅ Redirected to product page, handling there...');
          return await this.handleProductPageFlow(page);
        }
        return 'select_options_failed';
      }
      
      // ✅ WORK WITHIN THE PRODUCT MODAL CONTEXT
      console.log('🛒 Looking for Add to Cart button in PRODUCT modal...');
      
      let addedToCart = false;
      
      // ✅ TRY 1: Look for Add to Cart button specifically within the modal
      const modalAddToCartSelectors = [
        'button:has-text("Add to cart")',
        'button:has-text("Add to Cart")', 
        'button:has-text("ADD TO CART")',
        '.add-to-cart',
        '.product-form__cart-button',
        '[type="submit"]',
        '.m-button--primary:has-text("Add")',
        '.shopify-payment-button__button'
      ];
      
      for (const selector of modalAddToCartSelectors) {
        try {
          // Look within the modal context
          const addToCartBtn = productModal.locator(selector).first();
          if (await addToCartBtn.isVisible({ timeout: 5000 })) {
            const buttonText = await addToCartBtn.textContent() || await addToCartBtn.getAttribute('aria-label') || selector;
            console.log(`✅ Found Add to Cart button in modal: "${buttonText.trim()}"`);
            
            // ✅ ADDED: Check if button is clickable and not obscured
            const isEnabled = await addToCartBtn.isEnabled();
            if (!isEnabled) {
              console.log('⚠️ Add to Cart button is disabled, may need variant selection');
              // Try to select first available variant if button is disabled
              await this.selectFirstVariant(productModal);
              // Wait and check again
              await this.safeWait(page, 2000);
            }
            
            await addToCartBtn.click({ timeout: 15000 });
            console.log(`🖱️ Clicked Add to Cart in product modal: "${buttonText.trim()}"`);
            addedToCart = true;
            break;
          }
        } catch (e) {
          console.log(`❌ Selector ${selector} failed: ${e.message}`);
        }
      }
      
      // ✅ TRY 2: If Add to Cart not found, look for variant selection first
      if (!addedToCart) {
        console.log('🔄 Add to Cart button not found, checking if variant selection is needed...');
        const variantSelected = await this.selectFirstVariant(productModal);
        
        if (variantSelected) {
          console.log('✅ Variant selected, trying Add to Cart again...');
          await this.safeWait(page, 3000);
          
          // Try Add to Cart buttons again after variant selection
          for (const selector of modalAddToCartSelectors) {
            try {
              const addToCartBtn = productModal.locator(selector).first();
              if (await addToCartBtn.isVisible({ timeout: 5000 })) {
                await addToCartBtn.click({ timeout: 15000 });
                console.log(`🖱️ Clicked Add to Cart after variant selection`);
                addedToCart = true;
                break;
              }
            } catch (e) {
              // Continue
            }
          }
        }
      }
      
      // ✅ TRY 3: Fallback - find any submit or primary button in modal (EXCLUDE WISHLIST)
      if (!addedToCart) {
        console.log('🔄 Trying fallback: primary buttons in product modal...');
        const modalButtons = productModal.locator('button[type="submit"], .m-button--primary, .button--primary');
        const buttonCount = await modalButtons.count();
        
        console.log(`🔍 Found ${buttonCount} primary/submit buttons in product modal`);
        
        for (let i = 0; i < buttonCount; i++) {
          const button = modalButtons.nth(i);
          if (await button.isVisible({ timeout: 3000 })) {
            const buttonText = await button.textContent() || await button.getAttribute('aria-label') || 'Unknown Button';
            console.log(`🔍 Modal Primary Button ${i + 1}: "${buttonText.trim()}"`);
            
            // ✅ SKIP WISHLIST AND NON-CART BUTTONS
            if (this.isWishlistButton(buttonText) || 
                buttonText.includes('Search') || 
                buttonText.includes('Filter') ||
                buttonText.includes('List') ||
                buttonText.includes('columns')) {
              console.log(`⏭️ Skipping non-cart button: ${buttonText.trim()}`);
              continue;
            }
            
            // Only click if it looks like a cart button
            if (this.isCartButton(buttonText)) {
              try {
                await button.click({ timeout: 15000 });
                console.log(`🖱️ Clicked modal primary button: "${buttonText.trim()}"`);
                addedToCart = true;
                break;
              } catch (clickError) {
                console.log(`❌ Failed to click button: ${clickError.message}`);
              }
            }
          }
        }
      }

      // Wait for cart to update
      await this.safeWait(page, 5000);
      
      if (addedToCart) {
        console.log('✅ Successfully added product to cart from modal');
        return 'select_options_completed';
      } else {
        console.log('❌ Could not add product to cart from modal');
        return 'select_options_failed';
      }

    } catch (error) {
      console.log('❌ Error in Select Options flow:', error.message);
      return 'select_options_failed';
    }
  }

  // ✅ NEW: Popup handle karne ka method
  async handlePopups(page) {
    try {
      console.log('🛡️ Checking for popups...');
      // Common popup close buttons
      const popupSelectors = [
        'button[aria-label="Close"]',
        'button.close',
        '.popup-close',
        '.modal-close',
        'button:has-text("Close")',
        '.newsletter-close',
        '[data-close]',
        'button[data-dismiss="modal"]'
      ];

      for (const selector of popupSelectors) {
        try {
          const closeBtn = page.locator(selector).first();
          if (await closeBtn.isVisible({ timeout: 3000 })) {
            await closeBtn.click();
            console.log(`✅ Closed popup with selector: ${selector}`);
            await page.waitForTimeout(2000);
            break; // Ek popup close ho gaya toh break
          }
        } catch (e) {
          // Skip if selector not found
        }
      }

    } catch (error) {
      console.log('ℹ️ No popups found or error handling popups');
    }
  }

  // ✅ UPDATED: Process all products with individual checkout flow
  async processAllProductsWithIndividualCheckout(page) {
    try {
      console.log('🚀 Starting automation for all products with individual checkout...');
      // Step 1: Go to products page
      await page.goto('https://www.yugustore.com/collections/all', {
        waitUntil: 'domcontentloaded',
        timeout: 120000
      });
      await page.waitForSelector('.m-product-card', { timeout: 30000 });
      const productCards = page.locator('.m-product-card');
      const productCount = await productCards.count();
      console.log(`📦 Found ${productCount} products`);
      const results = [];
      // Step 2: Process each product with complete checkout flow
      for (let i = 0; i < productCount; i++) {
        console.log(`\n🔄 Processing Product ${i + 1}/${productCount} ---`);
        const result = await this.processProductWithCheckout(page, i);
        results.push(result);
        // Wait before next product
        await page.waitForTimeout(5000);
      }
      // Print final summary
      this.printFinalSummary(results);
      return results;
    } catch (error) {
      console.log('❌ Automation failed:', error.message);
      await page.screenshot({ path: 'automation-error.png' });
      throw error;
    }
  }

  // ✅ UPDATED: Process single product with complete checkout flow
  async processProductWithCheckout(page, productIndex) {
    try {
      // Get the specific product
      const productCards = page.locator('.m-product-card');
      const currentProduct = productCards.nth(productIndex);
      // Get product info
      let productName = `Product ${productIndex + 1}`;
      try {
        productName = await currentProduct.locator('a[aria-label]').first().getAttribute('aria-label');
      } catch (error) {
        console.log('Could not get product name');
      }
      console.log(`📦 Product: ${productName}`);

      // ✅ STEP 1: Add product to cart (IMPROVED: Better button detection)
      console.log('🛒 Adding product to cart...');

      const cartResult = await this.addToCart(currentProduct);

      if (cartResult.includes('no_button') || cartResult.includes('error')) {
        console.log('❌ No cart button found, skipping product');
        return { product: productName, status: 'failed', reason: 'no_cart_button' };
      }

      console.log(`✅ Product added to cart via ${cartResult}`);

      // ✅ If it's a select options flow, handle the modal
      if (cartResult === 'select_options') {
        console.log('🔄 Handling select options modal...');
        const modalResult = await this.handleSelectOptionsFlow(page);
        if (modalResult.includes('failed')) {
          console.log('❌ Select options flow failed, skipping product');
          return { product: productName, status: 'failed', reason: 'select_options_failed' };
        }
      }

      // ✅ ADDED: Wait for cart to update with loading
      console.log('⏳ Waiting for cart to update...');
      await page.waitForTimeout(8000);

      // ✅ STEP 2: Click checkout button
      console.log('🚀 Clicking checkout button...');
      const checkoutBtn = page.getByRole('button', { name: 'Check out' });
      await checkoutBtn.waitFor({ state: 'visible', timeout: 90000 });
      // ✅ ADDED: Extra wait before clicking checkout
      await page.waitForTimeout(3000);
      await checkoutBtn.click();
      console.log('✅ Checkout button clicked');

      // ✅ STEP 3: Wait for checkout page with loading
      console.log('⏳ Waiting for checkout page to load...');
      await page.waitForURL(/.*checkout.*/, { timeout: 60000 });
      console.log('✅ Checkout page loaded');

      // ✅ ADDED: Wait for checkout form to be ready
      await page.waitForTimeout(5000);

      // ✅ STEP 4: Fill checkout form
      console.log('📝 Filling checkout form...');
      await this.fillCheckoutForm(page);
      console.log('✅ Checkout form filled');

      // ✅ STEP 5: Complete payment
      console.log('💳 Completing payment...');
      await this.completePaymentProcess(page);
      console.log('✅ Payment completed');

      // ✅ STEP 6: Wait and go back to products for next iteration
      console.log('⏳ Waiting before returning to products...');
      await page.waitForTimeout(8000);
      console.log('🔄 Returning to products page...');
      await page.goto('https://www.yugustore.com/collections/all', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      // ✅ ADDED: Wait for products to load completely
      await page.waitForSelector('.m-product-card', { timeout: 30000 });
      console.log('✅ Products page loaded successfully');

      console.log(`🎉 Successfully processed: ${productName}`);
      return { product: productName, status: 'success', checkout: 'completed', method: cartResult };

    } catch (error) {
      console.log(`❌ Failed to process product ${productIndex + 1}:`, error.message);
      // Try to go back to products page for next iteration
      try {
        console.log('🔄 Attempting to return to products page after error...');
        await page.goto('https://www.yugustore.com/collections/all', {
          waitUntil: 'domcontentloaded',
          timeout: 90000
        });
        await page.waitForSelector('.m-product-card', { timeout: 30000 });
      } catch (e) {
        console.log('❌ Could not return to products page');
      }
      return { product: `Product ${productIndex + 1}`, status: 'failed', reason: error.message };
    }
  }

  // ✅ NEW: Complete payment process with better waits
  async completePaymentProcess(page) {
    // ✅ ADDED: Wait for payment section to load
    console.log('⏳ Waiting for payment section...');
    await page.waitForTimeout(5000);
    // Wait for Pay Now button and click
    const payNow = page.getByRole('button', { name: 'Pay now' });
    await payNow.waitFor({ state: 'visible', timeout: 60000 });
    // ✅ ADDED: Extra wait before payment
    await page.waitForTimeout(3000);
    await payNow.click();
    console.log('✅ Pay Now clicked');

    // Wait for success or redirect with longer timeout
    console.log('⏳ Waiting for payment confirmation...');
    await page.waitForLoadState('domcontentloaded', { timeout: 90000 });
    // ✅ ADDED: Additional wait for any post-payment processing
    await page.waitForTimeout(8000);
  }

  // ✅ NEW: Print final summary
  async printFinalSummary(results) {
    console.log('\n📊 FINAL AUTOMATION SUMMARY');
    console.log('==========================');
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;
    console.log(`✅ Successful Checkouts: ${successful}`);
    console.log(`❌ Failed Checkouts: ${failed}`);
    console.log(`📦 Total Products Processed: ${results.length}`);
    console.log(`🎯 Success Rate: ${((successful / results.length) * 100).toFixed(2)}%`);

    // Print methods used
    const methods = {};
    results.forEach(r => {
      if (r.method) {
        methods[r.method] = (methods[r.method] || 0) + 1;
      }
    });

    console.log('\n🛒 METHODS USED:');
    console.log('---------------');
    Object.entries(methods).forEach(([method, count]) => {
      console.log(`• ${method}: ${count}`);
    });

    // Print failed products details
    if (failed > 0) {
      console.log('\n❌ FAILED PRODUCTS DETAILS:');
      console.log('-------------------------');
      results.filter(r => r.status === 'failed').forEach((result, index) => {
        console.log(`${index + 1}. ${result.product}: ${result.reason}`);
      });
    }
    // Print successful products
    if (successful > 0) {
      console.log('\n✅ SUCCESSFUL PRODUCTS:');
      console.log('---------------------');
      results.filter(r => r.status === 'success').forEach((result, index) => {
        console.log(`${index + 1}. ${result.product} (${result.method || 'unknown'})`);
      });
    }
    console.log('\n🎉 AUTOMATION COMPLETED!');
  }

  // ✅ UPDATED: Single product add and checkout from shopping modal
  async addSingleProductAndCheckout(page) {
    try {
      console.log('🛒 Starting single product checkout process...');
      // Step 1: Add single product to cart
      await page.goto('https://www.yugustore.com/collections/all', {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      await page.waitForSelector('.m-product-card', { timeout: 30000 });
      const firstProduct = page.locator('.m-product-card').first();
      // Get product name
      let productName = 'First Product';
      try {
        productName = await firstProduct.locator('a[aria-label]').first().getAttribute('aria-label');
      } catch (error) {
        console.log('Could not get product name');
      }
      console.log(`📦 Adding to cart: ${productName}`);

      // ✅ UPDATED: Handle both Quick Add and Select Options
      const cartResult = await this.addToCart(firstProduct);

      if (cartResult.includes('no_button') || cartResult.includes('error')) {
        console.log('❌ No cart button found');
        return 'no_cart_button';
      }

      console.log(`✅ Product added to cart via ${cartResult}`);

      // ✅ If it's a select options flow, handle the modal
      if (cartResult === 'select_options') {
        console.log('🔄 Handling select options modal...');
        const modalResult = await this.handleSelectOptionsFlow(page);
        if (modalResult.includes('failed')) {
          console.log('❌ Select options flow failed');
          return 'select_options_failed';
        }
      }

      // Wait for cart to update with loading
      console.log('⏳ Waiting for cart to update...');
      await page.waitForTimeout(8000);

      // Step 2: Click checkout button from shopping modal/page
      console.log('🚀 Clicking checkout button...');
      const checkoutBtn = page.getByRole('button', { name: 'Check out' });
      await checkoutBtn.waitFor({ state: 'visible', timeout: 90000 });
      // ✅ ADDED: Extra wait before clicking
      await page.waitForTimeout(3000);
      await checkoutBtn.click();
      console.log('✅ Checkout button clicked');

      // ✅ Wait for checkout page to load with loading
      console.log('⏳ Waiting for checkout page to load...');
      await page.waitForURL(/.*checkout.*/, { timeout: 60000 });
      console.log('✅ Checkout page loaded');

      // ✅ ADDED: Wait for form to be ready
      await page.waitForTimeout(5000);

      // Step 3: Fill checkout form
      await this.fillCheckoutForm(page);
      console.log('🎉 Single product checkout completed successfully!');
      return `checkout_completed_via_${cartResult}`;

    } catch (error) {
      console.log('❌ Checkout failed:', error.message);
      await page.screenshot({ path: 'checkout-error.png' });
      throw error;
    }
  }

  // ✅ UPDATED: Separate method for filling checkout form with popup handling
  async fillCheckoutForm(page) {
    // ✅ ADDED: Wait for form to be completely loaded
    console.log('⏳ Waiting for checkout form to be ready...');
    await page.waitForTimeout(3000);
    // ✅ Check for popups before starting form fill
    await this.handlePopups(page);
    // ✅ Wait for email textbox to appear
    const emailField = page.getByRole('textbox', { name: 'Email' });
    await emailField.waitFor({ state: 'visible', timeout: 60000 });
    await emailField.click();
    await emailField.fill('test@gmail.com');
    console.log('✅ Email filled');
    await page.waitForTimeout(2000);

    const firstName = page.getByRole('textbox', { name: 'First name' });
    await firstName.waitFor({ state: 'visible', timeout: 60000 });
    await firstName.fill('Test');
    console.log('✅ First name filled');
    await page.waitForTimeout(1000);

    const lastName = page.getByRole('textbox', { name: 'Last name' });
    await lastName.waitFor({ state: 'visible', timeout: 60000 });
    await lastName.fill('Engineer');
    console.log('✅ Last name filled');
    await page.waitForTimeout(1000);

    const address = page.getByRole('combobox', { name: 'Address' });
    await address.waitFor({ state: 'visible', timeout: 60000 });
    await address.fill('UK');
    console.log('✅ Address filled');
    await page.waitForTimeout(1000);

    const apartment = page.getByRole('textbox', { name: 'Apartment, suite, etc.' });
    await apartment.waitFor({ state: 'visible', timeout: 60000 });
    await apartment.fill('85 City Road');
    console.log('✅ Apartment filled');
    await page.waitForTimeout(1000);

    const city = page.getByRole('textbox', { name: 'City' });
    await city.waitFor({ state: 'visible', timeout: 60000 });
    await city.fill('London');
    console.log('✅ City filled');
    await page.waitForTimeout(1000);

    const postcode = page.getByRole('textbox', { name: 'Postcode' });
    await postcode.waitFor({ state: 'visible', timeout: 60000 });
    await postcode.fill('SW45Ja');
    console.log('✅ Postcode filled');
    await page.waitForTimeout(1000);

    // Smooth scroll to bring payment section into view
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(2000);

    const phoneInput = page.getByPlaceholder('Phone', { exact: true });
    await phoneInput.waitFor({ state: 'visible', timeout: 60000 });
    await phoneInput.click();
    await phoneInput.fill('+44 3001234567');
    console.log('✅ Phone filled');
    await page.waitForTimeout(2000);

    // ===== Payment Section =====
    await this.fillPaymentDetails(page);
    // ✅ ADDED: Wait before final payment
    await page.waitForTimeout(3000);
    // Wait for Pay Now button and click
    const payNow = page.getByRole('button', { name: 'Pay now' });
    await payNow.waitFor({ state: 'visible', timeout: 60000 });
    await payNow.click();
    console.log('✅ Pay Now clicked');

    // Wait for success or redirect
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 });
  }

  // ✅ UPDATED: Separate method for payment details with popup handling
  async fillPaymentDetails(page) {
    // ✅ ADDED: Wait for payment iframes to load
    console.log('⏳ Waiting for payment iframes...');
    await page.waitForTimeout(5000);
    // ✅ Check for popups before payment details
    await this.handlePopups(page);
    // Card number iframe
    await page.waitForSelector('iframe[title="Field container for: Card number"]', { state: 'attached', timeout: 60000 });
    const cardNumberIframe = page.frameLocator('iframe[title="Field container for: Card number"]');
    const cardInput = cardNumberIframe.getByRole('textbox', { name: 'Card number' });
    await cardInput.waitFor({ state: 'visible', timeout: 60000 });
    await cardInput.fill('4111111111111111');
    console.log('✅ Card number filled');
    await page.waitForTimeout(2000);

    // ✅ Check for popups after card number
    await this.handlePopups(page);

    // Expiry iframe
    await page.waitForSelector('iframe[title="Field container for: Expiration date (MM / YY)"]', { state: 'attached', timeout: 60000 });
    const expiryInputField = page
      .frameLocator('iframe[title="Field container for: Expiration date (MM / YY)"]')
      .getByRole('textbox', { name: 'Expiration date (MM / YY)' });
    await expiryInputField.waitFor({ state: 'visible', timeout: 60000 });
    await expiryInputField.fill('12/25');
    console.log('✅ Expiry filled');
    await page.waitForTimeout(2000);

    // ✅ Check for popups after expiry
    await this.handlePopups(page);

    // CVC iframe
    await page.waitForSelector('iframe[title="Field container for: Security code"]', { state: 'attached', timeout: 60000 });
    const cvcInput = page.frameLocator('iframe[title="Field container for: Security code"]').getByRole('textbox', { name: 'Security code' });
    await cvcInput.waitFor({ state: 'visible', timeout: 60000 });
    await cvcInput.fill('123');
    console.log('✅ CVC filled');
    await page.waitForTimeout(2000);

    // ✅ Check for popups after CVC
    await this.handlePopups(page);

    // Name on Card iframe 
    await page.waitForSelector('iframe[title="Field container for: Name on card"]', { state: 'attached', timeout: 90000 });
    const NameonCardInput = page.frameLocator('iframe[title="Field container for: Name on card"]').getByRole('textbox', { name: 'Name on card' });
    await NameonCardInput.waitFor({ state: 'visible', timeout: 60000 });
    await NameonCardInput.fill('John Doe');
    console.log('✅ Name on Card filled');
    await page.waitForTimeout(2000);

    // ✅ Check for popups after name on card
    await this.handlePopups(page);
    await page.getByRole('textbox', { name: 'Mobile phone number' }).click();
    await page.getByRole('textbox', { name: 'Mobile phone number' }).fill('+44 3001234567');
    console.log('✅ Mobile number filled');
    await page.waitForTimeout(2000);

    // ✅ Final popup check before completing payment
    await this.handlePopups(page);
  }
}
import { test, expect } from '@playwright/test';

test('Verify Invoice Details List', async ({ page }) => {
  // 1. Go to Home - Should be logged in via storageState
  await page.goto('http://localhost:3000/');
  
  // Check if logged in, if not try login manual fallback
  if (await page.isVisible('input[type="email"]')) {
      console.log('Not logged in automatically, trying manual login...');
      await page.fill('input[type="email"]', 'admin@finansix.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
  }

  // 3. Wait for dashboard (balance hero or accounts)
  await page.waitForSelector('text=Saldo Total', { timeout: 15000 });

  // 4. Navigate to a Card with Invoice (Nubank from screenshot)
  // We can try direct URL if we don't know the ID, but clicking is safer
  // Find "Cartões" in menu (assuming bottom nav or sidebar)
  await page.goto('http://localhost:3000/cards'); // Direct route guess, or click menu
  
  // Wait for cards list
  await page.waitForSelector('text=Nubank', { timeout: 10000 });
  
  // Click on the Nubank card
  await page.click('text=Nubank');

  // 5. In Card Details, look for "Detalhes da Fatura" or current invoice summary
  // Click on the main invoice card/summary
  await page.click('text=Fatura Atual'); // Or similar selector

  // 6. Verify Transaction List
  // Look for items other than the summary
  // We expect to see transaction items. They usually have class 'col-span-1' or text like "R$"
  
  // Wait for list container
  await page.waitForSelector('.space-y-3', { timeout: 5000 });
  
  const transactions = page.locator('.space-y-3 > div'); // TransactionItem usually wrapped in div
  const count = await transactions.count();
  
  console.log(`Found ${count} transactions in invoice list.`);
  
  // Expect at least 1 transaction (the imported one or others)
  expect(count).toBeGreaterThan(0);
  
  // Check if we can find a date from previous month (e.g. "JAN" or "01/")
  const content = await page.content();
  const hasJanTransaction = content.includes('/01/') || content.includes('JAN');
  
  console.log('Has January Transaction visible:', hasJanTransaction);
});

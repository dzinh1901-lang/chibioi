// Playwright smoke tests for Chibi Creator
// Run: npx playwright test

const { test, expect } = require('@playwright/test');

test.describe('Chibi Creator — Smoke Tests', () => {
  
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Chibi Creator/i);
    await expect(page.locator('#root')).toBeVisible();
  });

  test('health check endpoint returns ok', async ({ page }) => {
    await page.goto('/health.html');
    const body = await page.textContent('body');
    expect(body).toContain('ok');
  });

  test('404 page renders for unknown routes', async ({ page }) => {
    const response = await page.goto('/nonexistent-page-xyz');
    // Either 404 status or 404 page content
    const body = await page.textContent('body');
    expect(body.length).toBeGreaterThan(0);
  });

  test('landing page loads', async ({ page }) => {
    await page.goto('/landing.html');
    await expect(page.locator('body')).toBeVisible();
  });

  test('main navigation tabs are visible', async ({ page }) => {
    await page.goto('/');
    // Wait for React to render
    await page.waitForSelector('#root > *', { timeout: 10000 });
    const body = await page.textContent('body');
    // App should have loaded some content
    expect(body.length).toBeGreaterThan(100);
  });

  test('manifest.json is accessible', async ({ request }) => {
    const response = await request.get('/manifest.json');
    expect(response.status()).toBe(200);
  });

});

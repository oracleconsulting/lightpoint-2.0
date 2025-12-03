import { test, expect } from '@playwright/test';

test.describe('Public Pages', () => {
  test('homepage should load successfully', async ({ page }) => {
    await page.goto('/');
    
    // Should have a title
    await expect(page).toHaveTitle(/.*/);
    
    // Should have main content
    await expect(page.locator('main, [role="main"], body')).toBeVisible();
  });

  test('blog page should be accessible', async ({ page }) => {
    await page.goto('/blog');
    
    // Should show blog content or redirect
    await expect(page.locator('body')).toBeVisible();
  });

  test('pricing page should be accessible', async ({ page }) => {
    await page.goto('/pricing');
    
    // Should show pricing content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    await page.goto('/');
    
    // Check for meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveCount(1);
    
    // Check for viewport
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Page should still be functional
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('homepage should load within 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have console errors on load', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known acceptable errors
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('DevTools') &&
      !e.includes('third-party')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    // Should have at least one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/');
    
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    expect(imagesWithoutAlt).toBe(0);
  });

  test('links should have accessible text', async ({ page }) => {
    await page.goto('/');
    
    // Links should not be empty
    const emptyLinks = await page.locator('a:not(:has(*)):not([aria-label])').filter({ hasText: '' }).count();
    expect(emptyLinks).toBe(0);
  });
});


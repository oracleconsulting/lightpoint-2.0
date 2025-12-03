import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to login or show login prompt
    await expect(page).toHaveURL(/.*login|.*signin|.*$/);
  });

  test('should have login form elements', async ({ page }) => {
    await page.goto('/login');
    
    // Check for email input
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();
    
    // Check for password input
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    
    // Check for submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
    await expect(submitButton).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.fill('input[type="email"], input[name="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
    
    // Should show error message
    await expect(page.locator('text=/error|invalid|incorrect/i')).toBeVisible({ timeout: 10000 });
  });

  test('should have forgot password link', async ({ page }) => {
    await page.goto('/login');
    
    const forgotLink = page.locator('a:has-text("Forgot"), a:has-text("Reset")');
    await expect(forgotLink).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect /dashboard to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login|.*signin/);
  });

  test('should redirect /complaints to login when unauthenticated', async ({ page }) => {
    await page.goto('/complaints');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login|.*signin/);
  });

  test('should redirect /admin to login when unauthenticated', async ({ page }) => {
    await page.goto('/admin');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login|.*signin/);
  });
});


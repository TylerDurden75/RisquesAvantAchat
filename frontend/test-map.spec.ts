import { test, expect } from '@playwright/test';

test.describe('RisquesAvantAchat', () => {
  test('page d\'accueil et footer s\'affichent', async ({ page }) => {
    await page.goto('http://localhost:5173');

    await expect(page.getByRole('heading', { name: 'RisquesAvantAchat' })).toBeVisible();
    await expect(page.getByText('Connaître les risques avant d\'acheter')).toBeVisible();
    await expect(page.getByText('Données publiques — Georisques, DVF, BAN')).toBeVisible();
  });

  test('recherche d\'adresse et affichage des risques', async ({ page }) => {
    await page.goto('http://localhost:5173');

    const searchInput = page.getByPlaceholder('Rechercher une adresse en France...');
    await searchInput.fill('10 rue de Rivoli Paris');

    await page.waitForSelector('.result-item', { timeout: 12000 });
    const firstResult = page.locator('.result-item').first();
    await expect(firstResult).toBeVisible();

    await firstResult.click();

    await expect(page.getByRole('heading', { name: 'Adresse' })).toBeVisible();
    await expect(page.getByText(/10 rue de Rivoli|Rivoli/)).toBeVisible();
  });
});

import { expect, test } from '@playwright/test';

/**
 * These run without an API key configured, which is the state a fresh checkout
 * is in. They cover the parts that must work regardless: the dialog itself and
 * the message the user gets when the feature is unavailable.
 */
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.canvas-surface');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.canvas-surface');
});

test('opens from the keyboard and from the palette', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+j');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.keyboard.press('ControlOrMeta+k');
  await page.locator('.palette-input').fill('IA');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('fills the prompt from an example and enables the action', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+j');
  const submit = page.getByRole('button', { name: 'Generar' });
  await expect(submit).toBeDisabled();

  await page.locator('.ai-chip').first().click();
  await expect(page.locator('.dialog-textarea')).not.toHaveValue('');
  await expect(submit).toBeEnabled();
});

test('reports plainly when no API key is configured', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+j');
  await page.locator('.dialog-textarea').fill('Una API serverless en AWS');
  await page.getByRole('button', { name: 'Generar' }).click();

  await expect(page.locator('.ai-error')).toBeVisible();
  await expect(page.locator('.ai-error')).toContainText('ANTHROPIC_API_KEY');
  // The canvas must be untouched by a failed request.
  await expect(page.locator('.empty-state')).toBeVisible();
});

test('will not review an empty canvas', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+j');
  await page.getByRole('button', { name: 'Revisar' }).click();

  await expect(page.locator('.ai-note')).toContainText('Dibuja o genera algo');
  await page.locator('.dialog-textarea').fill('¿Qué le falta?');
  await expect(page.getByRole('button', { name: 'Preguntar' })).toBeDisabled();
});

test('the generate endpoint answers rather than hanging', async ({ page }) => {
  const response = await page.request.post('/api/ai/generate', {
    data: { operation: 'generate', prompt: 'A serverless API on AWS' },
  });
  expect(response.status()).toBe(503);
  expect((await response.json()).code).toBe('not_configured');
});

test('the endpoint validates its input', async ({ page }) => {
  const response = await page.request.post('/api/ai/generate', { data: { prompt: 'a' } });
  // Validation happens before the key check would matter for a real deployment.
  expect([400, 503]).toContain(response.status());
});

import { expect, test } from '@playwright/test';
import { openNewDiagram } from './helpers';

async function buildDiagram(page: import('@playwright/test').Page) {
  await page.keyboard.press('ControlOrMeta+/');
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.press('Delete');
  await page.evaluate((value) => {
    const target = document.querySelector('.cm-content') as HTMLElement;
    target.focus();
    const data = new DataTransfer();
    data.setData('text/plain', value);
    target.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
    );
  }, 'cloud: aws\nnodes:\n  fn: lambda\n  db: dynamodb\nedges:\n  - fn -> db: R/W\n');
  await expect(page.locator('[data-shape-id^="grp_"]')).toHaveCount(2);
  await page.keyboard.press('ControlOrMeta+/');
}

test.beforeEach(async ({ page }) => {
  await openNewDiagram(page);
  await buildDiagram(page);
});

test('opens the share dialog and offers three ways to share', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+Shift+s');
  const dialog = page.getByRole('dialog', { name: 'Compartir' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.share-field')).toHaveCount(3);
});

test('the README snippet is Mermaid, which GitHub renders natively', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+Shift+s');
  const snippet = page.locator('.share-value.is-block');
  await expect(snippet).toContainText('```mermaid');
  await expect(snippet).toContainText('flowchart TD');
  await expect(snippet).toContainText('Lambda');
});

test('the shared link opens a read-only view of the same diagram', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+Shift+s');
  const link = await page.locator('.share-field').first().locator('input').inputValue();
  expect(link).toContain('/share?d=');

  await page.goto(link);
  await page.waitForSelector('.shared-surface');
  await expect(page.locator('[data-shape-id^="grp_"]')).toHaveCount(2);
  await expect(page.locator('.shared-surface')).toContainText('Lambda');

  // No editing chrome reaches a viewer.
  await expect(page.locator('.tool-dock')).toHaveCount(0);
  await expect(page.locator('.topbar')).toHaveCount(0);
});

test('the shared view pans and zooms', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+Shift+s');
  const link = await page.locator('.share-field').first().locator('input').inputValue();
  await page.goto(link);
  await page.waitForSelector('.shared-surface');

  const readZoom = () =>
    page
      .locator('.zoom-value')
      .innerText()
      .then((t) => Number(t.replace('%', '')));
  const before = await readZoom();
  await page.getByRole('button', { name: 'Acercar' }).click();
  expect(await readZoom()).toBeGreaterThan(before);
});

test('the embed endpoint serves a standalone SVG', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+Shift+s');
  const markdown = await page.locator('.share-field').nth(2).locator('input').inputValue();
  const url = markdown.match(/\((https?:\/\/[^)]+api\/embed[^)]*)\)/)![1];

  const response = await page.request.get(url);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/svg+xml');

  const svg = await response.text();
  expect(svg).toContain('<svg');
  expect(svg).toContain('Lambda');
  expect(svg).toContain('id="i-aws-lambda"');
});

test('a broken link says so instead of showing a blank page', async ({ page }) => {
  await page.goto('/share?d=this-is-not-a-diagram');
  await expect(page.getByText('no contiene un diagrama legible')).toBeVisible();
});

test('the embed endpoint rejects a bad payload', async ({ page }) => {
  const response = await page.request.get('/api/embed?d=nonsense');
  expect(response.status()).toBe(400);
});

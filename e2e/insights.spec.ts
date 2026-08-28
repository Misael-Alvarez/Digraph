import { expect, test } from '@playwright/test';
import { openNewDiagram } from './helpers';

/** Pastes a document into the code panel: typing it lets the editor re-indent it. */
async function setCode(page: import('@playwright/test').Page, text: string) {
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
  }, text);
}

async function openInsights(page: import('@playwright/test').Page) {
  await page.keyboard.press('ControlOrMeta+k');
  await page.locator('.palette input').first().fill('análisis');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.insight-list');
}

test.beforeEach(async ({ page }) => {
  await openNewDiagram(page);
});

test('an empty diagram is not given a score', async ({ page }) => {
  await openInsights(page);
  // A green 100 over nothing at all would be the most misleading number here.
  await expect(page.locator('.insight-score')).toHaveCount(0);
  await expect(page.locator('.insight-list')).toContainText('Todavía no hay nada');
});

test('names the cycle, the split and the loose node', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+/');
  await setCode(
    page,
    `version: 1
cloud: aws
nodes:
  api: apigateway
  auth: cognito
  orders: lambda
  db: dynamodb
  cache: elasticache
  lonely: s3
edges:
  - api -> auth: verify
  - auth -> orders: token
  - orders -> api: callback
  - orders -> db: R/W
  - db -> cache: warm
`,
  );
  await expect(page.locator('[data-shape-id^="grp_"]')).toHaveCount(6);

  await openInsights(page);
  const list = page.locator('.insight-list');
  await expect(list).toContainText('Dependencia circular');
  // Losing the database leaves the cache unreachable.
  await expect(list).toContainText('Si cae');
  await expect(list).toContainText('no está conectado a nada');
  await expect(page.locator('.insight-score')).toBeVisible();
});

test('a finding takes you to what it is about', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+/');
  await setCode(
    page,
    `version: 1
nodes:
  a: lambda
  b: dynamodb
  lonely: s3
edges:
  - a -> b: writes
`,
  );
  await expect(page.locator('[data-shape-id^="grp_"]')).toHaveCount(3);
  await openInsights(page);

  await page.locator('.insight-row').first().click();
  await expect(page.locator('.inspector')).toBeVisible();
});

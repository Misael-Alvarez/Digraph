import { expect, test, type Page } from '@playwright/test';
import { openNewDiagram } from './helpers';

async function openCode(page: Page) {
  await page.keyboard.press('ControlOrMeta+/');
  await expect(page.locator('.code-panel')).toBeVisible();
  await expect(page.locator('.cm-content')).toBeVisible();
}

async function codeText(page: Page) {
  return page.locator('.cm-content').innerText();
}

/**
 * Replaces the document by pasting, which is how YAML actually arrives in the
 * editor. Typing it character by character fights CodeMirror's auto-indent,
 * which adds leading whitespace of its own on every newline.
 */
async function setCode(page: Page, text: string) {
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

test.beforeEach(async ({ page }) => {
  await openNewDiagram(page);
});

test('opens and closes the split view', async ({ page }) => {
  await expect(page.locator('.code-panel')).toHaveCount(0);
  await openCode(page);
  await page.keyboard.press('ControlOrMeta+/');
  await expect(page.locator('.code-panel')).toHaveCount(0);
});

test('code drives the canvas', async ({ page }) => {
  await openCode(page);
  await setCode(
    page,
    'cloud: aws\nnodes:\n  api: apigateway\n  fn: lambda\nedges:\n  - api -> fn: invoke\n',
  );

  await expect(page.locator('[data-shape-id^="grp_"]')).toHaveCount(2);
  await expect(page.locator('.canvas-surface')).toContainText('API Gateway');
  await expect(page.locator('.canvas-surface')).toContainText('Lambda');
  await expect(page.locator('.canvas-surface')).toContainText('invoke');
});

test('the canvas drives the code once the editor loses focus', async ({ page }) => {
  await openCode(page);
  await setCode(page, 'cloud: aws\nnodes:\n  fn: lambda\nedges: []\n');
  await expect(page.locator('[data-shape-id^="grp_"]')).toHaveCount(1);

  // Move focus out of the editor, then add a shape from the canvas side.
  await page.locator('.tool-button').nth(3).click();
  await page.locator('.canvas-surface').click({ position: { x: 700, y: 420 } });

  await expect.poll(() => codeText(page)).toContain('New Item');
  await expect(page.locator('[data-shape-id^="grp_"]')).toHaveCount(2);
});

test('reports an unknown service without destroying the diagram', async ({ page }) => {
  await openCode(page);
  await setCode(page, 'cloud: aws\nnodes:\n  ok: lambda\n  bad: not-a-service\nedges: []\n');

  await expect(page.locator('.code-badge.is-error')).toBeVisible();
  await expect(page.locator('.code-panel-footer')).toContainText('Unknown service');
  // The valid half still renders.
  await expect(page.locator('[data-shape-id^="grp_"]')).toHaveCount(2);
});

test('keeps broken source instead of overwriting it from the model', async ({ page }) => {
  await openCode(page);
  await setCode(page, 'cloud: aws\nnodes:\n  fn: lambda\nedges: []\n');
  await expect(page.locator('[data-shape-id^="grp_"]')).toHaveCount(1);

  await setCode(page, 'nodes:\n  broken: [unclosed\n');
  await expect(page.locator('.code-badge.is-error')).toBeVisible();

  // Editing the canvas must not silently discard what the user is fixing.
  await page.locator('.tool-button').nth(3).click();
  await page.locator('.canvas-surface').click({ position: { x: 700, y: 420 } });
  await expect.poll(() => codeText(page)).toContain('unclosed');
});

test('a code edit is a single undo step', async ({ page }) => {
  await openCode(page);
  await setCode(page, 'cloud: aws\nnodes:\n  fn: lambda\n  db: dynamodb\nedges: []\n');
  await expect(page.locator('[data-shape-id^="grp_"]')).toHaveCount(2);

  await page.locator('.canvas-surface').click({ position: { x: 60, y: 60 } });
  await page.keyboard.press('ControlOrMeta+z');
  await expect(page.locator('[data-shape-id^="grp_"]')).toHaveCount(0);
});

test('offers a read-only Mermaid view', async ({ page }) => {
  await openCode(page);
  await setCode(
    page,
    'cloud: aws\nnodes:\n  fn: lambda\n  db: dynamodb\nedges:\n  - fn -> db: R/W\n',
  );
  await expect(page.locator('[data-shape-id^="grp_"]')).toHaveCount(2);

  await page.getByRole('button', { name: 'Mermaid' }).click();
  await expect.poll(() => codeText(page)).toContain('flowchart TD');
  await expect(page.locator('.code-badge.is-muted')).toContainText('read-only');
  await expect.poll(() => codeText(page)).toContain('aion:services');
});

test('autocompletes service names', async ({ page }) => {
  await openCode(page);
  await setCode(page, 'cloud: aws\nnodes:\n  fn: ');
  await page.keyboard.type('dynam');

  await expect(page.locator('.cm-tooltip-autocomplete')).toBeVisible();
  await expect(page.locator('.cm-tooltip-autocomplete li').first()).toContainText('dynamodb');
});

test('the code view survives a reload', async ({ page }) => {
  await openCode(page);
  await page.reload();
  await page.waitForSelector('.canvas-surface');
  await expect(page.locator('.code-panel')).toBeVisible();
});

test('the code panel can be closed from inside itself', async ({ page }) => {
  // The shortcut that opens a panel has to work from within it; the typing guard
  // used to swallow it, so the editor could be opened but not closed.
  await openCode(page);
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+/');
  await expect(page.locator('.code-panel')).toHaveCount(0);
});

test('shortcuts still work after closing the code panel', async ({ page }) => {
  await openCode(page);
  await page.locator('.cm-content').click();
  await page.keyboard.press('ControlOrMeta+/');
  await expect(page.locator('.code-panel')).toHaveCount(0);

  await page.keyboard.press('ControlOrMeta+j');
  await expect(page.getByRole('dialog')).toBeVisible();
});

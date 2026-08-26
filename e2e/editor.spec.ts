import { expect, test, type Page } from '@playwright/test';
import { openNewDiagram, pagePoint } from './helpers';

/** Canvas-space position of the first group, read from its tagged rect. */
async function groupRect(page: Page) {
  return page.evaluate(() => {
    const el = document.querySelector('[data-shape-id^="grp_"]') as SVGRectElement | null;
    if (!el) return null;
    return { x: Number(el.getAttribute('x')), y: Number(el.getAttribute('y')) };
  });
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await openNewDiagram(page);
  (page as Page & { __errors?: string[] }).__errors = errors;
});

test('renders the canvas-first chrome', async ({ page }) => {
  await expect(page.locator('.topbar')).toBeVisible();
  await expect(page.locator('.tool-dock')).toBeVisible();
  await expect(page.locator('.zoom-controls')).toBeVisible();
  await expect(page.locator('.statusbar')).toBeVisible();
  // The inspector is contextual: nothing selected means it is not on screen.
  await expect(page.locator('.inspector')).toHaveCount(0);
  await expect(page.locator('.empty-state')).toBeVisible();
});

test('places a group from the tool dock', async ({ page }) => {
  await page.locator('.tool-button').nth(3).click();
  await page.locator('.canvas-surface').click({ position: { x: 500, y: 300 } });

  await expect(page.locator('.empty-state')).toHaveCount(0);
  await expect(page.locator('.statusbar-meta').first()).toContainText('3');
});

test('undo restores the exact position after a drag', async ({ page }) => {
  await page.locator('.tool-button').nth(3).click();
  await page.locator('.canvas-surface').click({ position: { x: 400, y: 300 } });
  await page.locator('.canvas-surface').click({ position: { x: 420, y: 320 } });
  await expect(page.locator('.inspector')).toBeVisible();

  const before = await groupRect(page);
  expect(before).not.toBeNull();

  // mouse.* takes page coordinates, while locator.click takes element-relative
  // ones; the canvas sits below the top bar, so they are not interchangeable.
  const from = await pagePoint(page, 420, 320);
  const to = await pagePoint(page, 620, 460);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await page.mouse.up();

  const afterDrag = await groupRect(page);
  expect(afterDrag!.x).not.toBe(before!.x);

  // This is the regression: the old editor pushed the already-moved model onto
  // the history, so Ctrl+Z did nothing.
  await page.keyboard.press('ControlOrMeta+z');
  const afterUndo = await groupRect(page);
  expect(afterUndo).toEqual(before);

  await page.keyboard.press('ControlOrMeta+Shift+z');
  expect(await groupRect(page)).toEqual(afterDrag);
});

test('opens the command palette and adds a service', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+k');
  await expect(page.locator('.palette')).toBeVisible();

  await page.locator('.palette-input').fill('lambda');
  await expect(page.locator('.palette-row').first()).toBeVisible();
  await page.keyboard.press('Enter');

  await expect(page.locator('.palette')).toHaveCount(0);
  await expect(page.locator('.empty-state')).toHaveCount(0);
});

test('zooms at the cursor with ctrl+wheel', async ({ page }) => {
  const readZoom = () =>
    page
      .locator('.zoom-value')
      .innerText()
      .then((t) => Number(t.replace('%', '')));

  expect(await readZoom()).toBe(100);
  const centre = await pagePoint(page, 600, 400);
  await page.mouse.move(centre.x, centre.y);
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, -240);
  await page.keyboard.up('Control');

  expect(await readZoom()).toBeGreaterThan(100);
});

test('selection opens the contextual inspector and edits the title', async ({ page }) => {
  await page.locator('.tool-button').nth(3).click();
  await page.locator('.canvas-surface').click({ position: { x: 500, y: 300 } });
  await page.locator('.canvas-surface').click({ position: { x: 520, y: 320 } });

  await expect(page.locator('.inspector')).toBeVisible();
  await page.locator('.inspector .input').first().fill('Payments API');
  await expect(page.locator('.canvas-surface')).toContainText('Payments API');
});

test('Delete removes the selection, but not while typing in a field', async ({ page }) => {
  await page.locator('.tool-button').nth(3).click();
  await page.locator('.canvas-surface').click({ position: { x: 500, y: 300 } });
  await page.locator('.canvas-surface').click({ position: { x: 520, y: 320 } });
  await expect(page.locator('.inspector')).toBeVisible();

  // Focus inside a text field: Delete must edit the text, not destroy the shape.
  await page.locator('.inspector .input').first().click();
  await page.keyboard.press('Delete');
  await expect(page.locator('.inspector')).toBeVisible();

  // Focus back on the canvas: now Delete removes the shape.
  await page.locator('.canvas-surface').click({ position: { x: 520, y: 320 } });
  await page.keyboard.press('Delete');
  await expect(page.locator('.inspector')).toHaveCount(0);
  await expect(page.locator('.empty-state')).toBeVisible();
});

test('toggles dark mode and keeps it across a reload', async ({ page }) => {
  await page.getByRole('button', { name: /modo oscuro|toggle dark/i }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  await page.reload();
  await page.waitForSelector('.canvas-surface');
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('reports no console or page errors', async ({ page }) => {
  await page.locator('.tool-button').nth(3).click();
  await page.locator('.canvas-surface').click({ position: { x: 500, y: 300 } });
  await page.keyboard.press('ControlOrMeta+k');
  await page.keyboard.press('Escape');

  const errors = (page as Page & { __errors?: string[] }).__errors ?? [];
  expect(errors).toEqual([]);
});

test('double-click focuses the title field for quick renaming', async ({ page }) => {
  await page.locator('.tool-button').nth(3).click();
  await page.locator('.canvas-surface').click({ position: { x: 500, y: 300 } });

  const shape = await pagePoint(page, 520, 320);
  await page.mouse.dblclick(shape.x, shape.y);

  await expect(page.locator('.inspector')).toBeVisible();
  await expect(page.locator('.inspector .input').first()).toBeFocused();
});

test('every advertised command is reachable from the palette', async ({ page }) => {
  // Guards against a menu entry that points at nothing, which is how the old
  // editor ended up advertising Ctrl+S without implementing it.
  for (const term of ['Abrir', 'Guardar', 'Exportar SVG', 'Plantillas', 'Atajos']) {
    await page.keyboard.press('ControlOrMeta+k');
    await page.locator('.palette-input').fill(term);
    await expect(page.locator('.palette-row').first()).toBeVisible();
    await page.keyboard.press('Escape');
  }
});

test('a resting pointer cannot steal the palette selection', async ({ page }) => {
  // Opening the palette under a stationary cursor used to highlight whatever row
  // rendered beneath it, so a blind Enter could fire a destructive command.
  await page.mouse.move(720, 300);
  await page.keyboard.press('ControlOrMeta+k');
  await page.locator('.palette-input').fill('IA');
  await expect(page.locator('.palette-row.is-active .palette-label')).toContainText('IA');

  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
});

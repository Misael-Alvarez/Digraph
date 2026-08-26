import { describe, expect, it } from 'vitest';
import { parseDsl } from '@/lib/dsl';
import { buildShareLinks, payloadFromSearch, themeFromSearch } from './links';
import { safeDecodeDiagram } from './codec';

const sample = parseDsl(
  'cloud: aws\nnodes:\n  fn: lambda\n  db: dynamodb\nedges:\n  - fn -> db: R/W\n',
).model!;

describe('buildShareLinks', () => {
  it('builds a view link and an image link on the given origin', async () => {
    const links = await buildShareLinks(sample, 'https://studio.example.com');
    expect(links.view.startsWith('https://studio.example.com/share?d=')).toBe(true);
    expect(links.image.startsWith('https://studio.example.com/api/embed?d=')).toBe(true);
  });

  it('tolerates a trailing slash on the origin', async () => {
    const links = await buildShareLinks(sample, 'https://studio.example.com/');
    expect(links.view).not.toContain('.com//');
  });

  it('carries the diagram inside the link', async () => {
    const links = await buildShareLinks(sample, 'https://x.test');
    const payload = payloadFromSearch(new URL(links.view).search)!;
    const decoded = await safeDecodeDiagram(payload);
    expect(decoded?.shapes).toHaveLength(sample.shapes.length);
  });

  it('uses Mermaid for the README snippet, not an image', async () => {
    // GitHub renders Mermaid natively and strips remote SVG, so an image link
    // would silently show nothing exactly where people paste these most.
    const links = await buildShareLinks(sample, 'https://x.test');
    expect(links.readme.startsWith('```mermaid')).toBe(true);
    expect(links.readme).toContain('flowchart TD');
    expect(links.readme.trimEnd().endsWith('```')).toBe(true);
    expect(links.readme).not.toContain('/api/embed');
  });

  it('offers an image snippet for platforms that do render remote SVG', async () => {
    const links = await buildShareLinks(sample, 'https://x.test');
    expect(links.markdownImage).toMatch(
      /^\[!\[Architecture diagram\]\(https:\/\/x\.test\/api\/embed/,
    );
    expect(links.html).toContain('<img src="https://x.test/api/embed');
  });

  it('passes the theme through to both links', async () => {
    const light = await buildShareLinks(sample, 'https://x.test', 'light');
    const dark = await buildShareLinks(sample, 'https://x.test', 'dark');
    expect(light.view).not.toContain('theme=');
    expect(dark.view).toContain('theme=dark');
    expect(dark.image).toContain('theme=dark');
  });

  it('reports the payload size so the caller can warn about long links', async () => {
    const links = await buildShareLinks(sample, 'https://x.test');
    expect(links.payloadLength).toBeGreaterThan(0);
    // The reported length is the payload itself, not the whole URL.
    expect(new URL(links.view).searchParams.get('d')).toHaveLength(links.payloadLength);
  });

  it('produces links that survive URL parsing untouched', async () => {
    const links = await buildShareLinks(sample, 'https://x.test');
    expect(new URL(links.view).toString()).toBe(links.view);
    expect(new URL(links.image).toString()).toBe(links.image);
  });
});

describe('reading a link', () => {
  it('extracts the payload', () => {
    expect(payloadFromSearch('?d=abc&theme=dark')).toBe('abc');
    expect(payloadFromSearch('?theme=dark')).toBeNull();
  });

  it('defaults the theme to light', () => {
    expect(themeFromSearch('?d=abc')).toBe('light');
    expect(themeFromSearch('?d=abc&theme=dark')).toBe('dark');
    expect(themeFromSearch('?d=abc&theme=nonsense')).toBe('light');
  });

  it('accepts URLSearchParams as well as a string', () => {
    expect(payloadFromSearch(new URLSearchParams({ d: 'xyz' }))).toBe('xyz');
  });
});

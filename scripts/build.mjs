import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

const root = fileURLToPath(new URL('../', import.meta.url));
const routeRoot = resolve(root, 'src/routes');
const accepted = 'kb/decisions/0001-dedupe-by-subject';
const authored = 'kb/incidents/4471-split';
const originalDecisionHash = '41ac5460f198519b61b72c1a344a89fc3f9c26eda481ad85d710fa23f336a1c9';
const check = process.argv.includes('--check');

async function pages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const path = resolve(dir, entry.name);
    return entry.isDirectory() ? pages(path) : entry.name === '+page.svx' ? [path] : [];
  }))).flat().sort();
}

const server = await createServer({
  root,
  configFile: false,
  publicDir: false,
  logLevel: 'error',
  resolve: { alias: { '#lib': resolve(root, 'src/lib') } },
  plugins: [svelte({
    configFile: false,
    extensions: ['.svelte', '.svx'],
    compilerOptions: { dev: false, css: 'injected' },
    preprocess: mdsvex({
      extensions: ['.svx'],
      layout: { runbook: resolve(root, 'src/lib/layouts/runbook.svelte') },
    }),
  })],
  server: { middlewareMode: true, hmr: false },
});

try {
  const { render } = await server.ssrLoadModule('svelte/server');
  const output = new Map();
  for (const file of await pages(routeRoot)) {
    const page = await server.ssrLoadModule(file);
    const { head, body } = render(page.default);
    const route = dirname(relative(routeRoot, file));
    const html = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${head}</head><body>${body}</body></html>\n`;
    const target = resolve(root, 'rendered', route, 'index.html');
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, html);
    output.set(route, html);
  }

  if (check) {
    const decisionBytes = await readFile(resolve(routeRoot, accepted, '+page.svx'));
    assert.equal(createHash('sha256').update(decisionBytes).digest('hex'), originalDecisionHash,
      'Accepted decision 0001 must remain byte-for-byte unchanged');
    const { split, summarizeSplit } = await server.ssrLoadModule('/src/lib/kb/split-summary.ts');
    const { deskRef } = await server.ssrLoadModule('/src/lib/kb/desk-ref.ts');
    const { daysSince } = await server.ssrLoadModule('/src/lib/kb/staleness.ts');
    const { metadata } = await server.ssrLoadModule(resolve(routeRoot, authored, '+page.svx'));
    assert.equal(metadata.owner, 'andrzej1990m');
    assert.equal(createHash('sha256').update(metadata.signature).digest('hex'),
      '978a6e232d1256839bf5a17f273ad664e508d7174f872b296524a8f62062ffeb',
      'Signature must be the exact public provenance ticket supplied by start-challenge');
    assert.deepEqual([split.raw, split.duplicates, split.total, split.tagErrors], [427, 15, 412, 38]);
    assert.deepEqual(split.groups.map((g) => [g.cause, g.reports.length, g.tenants]), [
      ['parser', 379, 11], ['hint', 33, 3],
    ]);
    assert.deepEqual(split.groups.map((g) =>
      g.reports.filter((r) => r.meta.intakeTag !== g.cause).length), [23, 15]);
    assert.equal(split.deskNotes.length, 5);
    assert.ok(split.deskNotes.every((r) => split.groups[0].reports.some((p) => p.id === r.id)));
    const sample = split.groups[0].reports[0];
    const deduped = summarizeSplit([sample, sample, { ...sample, id: 'outside', mergedInto: 999 }], 4471);
    assert.deepEqual([deduped.raw, deduped.total, deduped.duplicates], [2, 1, 1]);
    const unknown = summarizeSplit([{ ...sample, tenant: 'unknown' }], 4471);
    assert.equal(unknown.groups[0].cause, 'unplaced');
    assert.equal(unknown.tagErrors, 0);

    const html = output.get(authored);
    const text = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    for (const phrase of [
      '379 parser + 33 hint = 412 unique reports',
      '427 raw rows; 15 overlapping duplicate rows',
      '38 intake tag errors',
      '5 desk-noted reports remain included in the parser count',
      'owner andrzej1990m',
      'proposed',
      `reviewed 2026-10-28 · ${daysSince('2026-10-28')} days ago`,
      `desk ref ${deskRef(metadata.signature)}`,
      '#4471 closed on 2026-10-05',
      'FIXED: fix(dates): parse dd/mm for eu locales',
      "WON'T FIX: booking-v3 form retired",
      'Issue #1 is closed completed',
      'issue #2 is closed not_planned',
    ]) assert.ok(text.includes(phrase), `Missing rendered content: ${phrase}`);
    for (const report of split.deskNotes) assert.ok(text.includes(report.id));
    assert.ok(html.includes('<title>#4471 · split by cause, not subject · support kb</title>'));
    assert.ok(html.includes('<style'), 'Compiled component styles must be included');
    for (const href of [
      'https://github.com/andrzej1990m/mega-s01e03/issues/1',
      'https://github.com/andrzej1990m/mega-s01e03/issues/2',
      '/kb/decisions/0001-dedupe-by-subject',
    ]) assert.ok(html.includes(`href="${href}"`), `Missing actual link: ${href}`);
    assert.ok(output.get('kb').includes(`href="/${authored}"`), 'Existing index glob must discover the new page');
    assert.ok(output.get(accepted).includes('Check it against the live views'),
      'Historical decision must render the real staleness banner');
    assert.ok(output.get(accepted).includes('accepted'));
    console.log(`Checks passed: counts, uncertainties, closure outcomes, links, index, layout, signature ${deskRef(metadata.signature)}, immutable decision.`);
  }
  console.log(`Rendered ${output.size} compiled Svelte/mdsvex pages into rendered/.`);
} finally {
  await server.close();
}

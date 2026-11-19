import assert from 'node:assert/strict';
import test from 'node:test';
import { getPageContext, reportSiteUrl } from './page.ts';

test('query parameters are context, not page identity', () => {
  const a = getPageContext('https://example.com/products?sort=price');
  const b = getPageContext('https://example.com/products?sort=name');
  assert.equal(a.pagePath, b.pagePath);
  assert.notEqual(a.url, b.url);
});
test('hash routes identify pages and ignore route queries', () => {
  assert.equal(getPageContext('https://example.com/#/products?sort=price').pagePath, '/#/products');
  assert.equal(getPageContext('https://example.com/#!/products').pagePath, '/#/products');
  assert.equal(getPageContext('https://example.com/products#details').pagePath, '/products');
});
test('origins retain scheme and port for environment matching', () => {
  assert.equal(getPageContext('http://localhost:3000/products').origin, 'http://localhost:3000');
  assert.throws(() => getPageContext('file:///tmp/page.html'));
});

test('report links retain the site page, query parameters and fragment', () => {
  const url = reportSiteUrl('https://example.com/cataloghi?lang=it&__reporty_issue=old#listing', 'current');
  assert.equal(url, 'https://example.com/cataloghi?lang=it&__reporty_issue=current#listing');
  assert.equal(getPageContext(url).pagePath, '/cataloghi');
  assert.equal(reportSiteUrl('https://example.com/#/cataloghi?lang=it', 'current'),
    'https://example.com/?__reporty_issue=current#/cataloghi?lang=it');
});

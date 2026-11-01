const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateCell, arithmetic, columnIndex } = require('../src/formula');

test('column labels convert beyond Z', () => {
  assert.equal(columnIndex('A'), 0);
  assert.equal(columnIndex('Z'), 25);
  assert.equal(columnIndex('AA'), 26);
});

test('arithmetic parser handles precedence and parentheses', () => {
  assert.equal(arithmetic('2 + 3 * 4'), 14);
  assert.equal(arithmetic('(2 + 3) * 4'), 20);
  assert.equal(arithmetic('18 / 3 - 2'), 4);
});

test('grid calculates basic arithmetic and range functions', () => {
  const cells = [['10','20','=A1+B1'], ['5','7','=SUM(A1:B2)'], ['', '', '=AVERAGE(A1:B2)']];
  assert.equal(calculateCell(cells, 0, 2), 30);
  assert.equal(calculateCell(cells, 1, 2), 42);
  assert.equal(calculateCell(cells, 2, 2), 10.5);
});

test('formula cycle is reported instead of recursing forever', () => {
  const cells = [['=B1','=A1']];
  assert.equal(calculateCell(cells, 0, 0), '#VALUE!');
});

test('COUNT and AVERAGE ignore blank cells in ranges', () => {
  const cells = [['10'], [''], ['20'], ['=COUNT(A1:A3)'], ['=AVERAGE(A1:A3)']];
  assert.equal(calculateCell(cells, 3, 0), 2);
  assert.equal(calculateCell(cells, 4, 0), 15);
});

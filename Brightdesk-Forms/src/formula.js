(function (root) {
  function columnIndex(label) {
    let value = 0;
    for (const ch of label.toUpperCase()) value = value * 26 + ch.charCodeAt(0) - 64;
    return value - 1;
  }
  function arithmetic(expression) {
    const tokens = expression.match(/\d+(?:\.\d+)?|[()+\-*/%]/g) || [];
    let at = 0;
    function factor() {
      const token = tokens[at++];
      if (token === '-') return -factor();
      if (token === '+') return factor();
      if (token === '(') {
        const value = expr();
        if (tokens[at++] !== ')') throw new Error('Missing closing parenthesis');
        return value;
      }
      const value = Number(token);
      if (!Number.isFinite(value)) throw new Error('Invalid number');
      return value;
    }
    function term() {
      let value = factor();
      while (['*', '/', '%'].includes(tokens[at])) {
        const op = tokens[at++], next = factor();
        value = op === '*' ? value * next : op === '/' ? value / next : value % next;
      }
      return value;
    }
    function expr() {
      let value = term();
      while (['+', '-'].includes(tokens[at])) {
        const op = tokens[at++], next = term();
        value = op === '+' ? value + next : value - next;
      }
      return value;
    }
    if (!tokens.length) return 0;
    const value = expr();
    if (at !== tokens.length) throw new Error('Invalid formula');
    return value;
  }
  function calculateCell(cells, row, col, stack = new Set()) {
    const raw = String(cells?.[row]?.[col] ?? '').trim();
    if (!raw.startsWith('=')) return raw !== '' && Number.isFinite(Number(raw)) ? Number(raw) : (raw || '');
    const id = `${row}:${col}`;
    if (stack.has(id)) return '#CYCLE!';
    stack.add(id);
    const getRef = (ref) => {
      const match = String(ref).trim().match(/^([A-Z]+)(\d+)$/i);
      if (!match) throw new Error('Invalid cell reference');
      return calculateCell(cells, Number(match[2]) - 1, columnIndex(match[1]), stack);
    };
    const getRange = (range) => {
      const match = String(range).trim().match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);
      if (!match) return [getRef(range)];
      const c1 = columnIndex(match[1]), c2 = columnIndex(match[3]);
      const r1 = Number(match[2]) - 1, r2 = Number(match[4]) - 1;
      const values = [];
      for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
        for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) values.push(calculateCell(cells, r, c, stack));
      }
      return values;
    };
    try {
      const formula = raw.slice(1).trim();
      const fn = formula.match(/^(SUM|AVERAGE|MIN|MAX|COUNT|COUNTA)\((.*)\)$/i);
      let result;
      if (fn) {
        const values = fn[2].split(',').flatMap(getRange);
        const numbers = values
          .filter(value => value !== '' && value !== null && value !== undefined && !(typeof value === 'string' && value.trim() === ''))
          .map(Number)
          .filter(Number.isFinite);
        switch (fn[1].toUpperCase()) {
          case 'SUM': result = numbers.reduce((sum, n) => sum + n, 0); break;
          case 'AVERAGE': result = numbers.length ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : 0; break;
          case 'MIN': result = numbers.length ? Math.min(...numbers) : 0; break;
          case 'MAX': result = numbers.length ? Math.max(...numbers) : 0; break;
          case 'COUNT': result = numbers.length; break;
          case 'COUNTA': result = values.filter(v => v !== '' && v !== null && v !== undefined).length; break;
        }
      } else {
        const expression = formula.replace(/([A-Z]+\d+)/gi, ref => {
          const value = getRef(ref);
          if (typeof value !== 'number') throw new Error('Cell is not numeric');
          return String(value);
        });
        if (!/^[\d\s.+\-*/()%]+$/.test(expression)) throw new Error('Unsupported expression');
        result = arithmetic(expression);
      }
      return Number.isFinite(result) ? Number(result.toFixed(8)) : '#VALUE!';
    } catch {
      return '#VALUE!';
    } finally {
      stack.delete(id);
    }
  }
  const api = { columnIndex, arithmetic, calculateCell };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.BrightdeskFormula = api;
})(typeof window !== 'undefined' ? window : globalThis);

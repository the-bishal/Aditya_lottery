/**
 * numberWorker.js — Web Worker
 * Handles CPU-heavy number set operations off the main thread.
 * Supported messages:
 *   { type: 'PARSE_RANGES',   payload: { text } }
 *   { type: 'FILTER_NUMBERS', payload: { numbers, excludedArray } }
 */

// ── Range parser (duplicated here — worker has no module imports) ─────────────
function parseRangeString(input) {
  const result = new Set();
  if (!input) return result;

  const tokens = input.split(/[\n,;]+/).map(t => t.trim()).filter(Boolean);

  for (const token of tokens) {
    const parts = token.split('-').map(p => p.trim());
    if (parts.length === 2) {
      const s = parseInt(parts[0], 10);
      const e = parseInt(parts[1], 10);
      if (!isNaN(s) && !isNaN(e) && s <= e) {
        for (let i = s; i <= e; i++) result.add(i);
      }
    } else {
      const n = parseInt(parts[0], 10);
      if (!isNaN(n)) result.add(n);
    }
  }
  return result;
}

// ── Message handler ──────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'PARSE_RANGES': {
      const set = parseRangeString(payload.text);
      self.postMessage({ type: 'PARSE_RANGES_DONE', result: [...set] });
      break;
    }

    case 'FILTER_NUMBERS': {
      const excluded = new Set(payload.excludedArray.map(Number));
      const filtered = payload.numbers.filter(
        n => !excluded.has(parseInt(n, 10))
      );
      self.postMessage({ type: 'FILTER_NUMBERS_DONE', result: filtered });
      break;
    }

    default:
      self.postMessage({ type: 'ERROR', message: `Unknown type: ${type}` });
  }
});

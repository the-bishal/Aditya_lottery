/**
 * numberParser.js
 * Parses human-friendly range strings like "100-200, 305, 410-420"
 * into a Set of individual numbers. Runs in the main thread for small sets;
 * for large sets the numberWorker.js is used instead.
 */

/**
 * Parse a range/number string and return a Set<number>.
 * Supports:
 *  - Single numbers: "100"
 *  - Ranges: "100-200"
 *  - Comma or newline separated mixed: "100-110, 205\n300-310"
 *
 * @param {string} input
 * @returns {Set<number>}
 */
export function parseRangeString(input) {
  const result = new Set();
  if (!input || typeof input !== 'string') return result;

  const tokens = input
    .split(/[\n,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  for (const token of tokens) {
    const rangeParts = token.split('-').map((p) => p.trim());

    if (rangeParts.length === 2) {
      const start = parseInt(rangeParts[0], 10);
      const end   = parseInt(rangeParts[1], 10);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) result.add(i);
      }
    } else if (rangeParts.length === 1) {
      const n = parseInt(rangeParts[0], 10);
      if (!isNaN(n)) result.add(n);
    }
  }

  return result;
}

/**
 * Filter an array of number strings against an excluded Set.
 * Returns only numbers NOT in the exclusion set.
 *
 * @param {string[]} numbers
 * @param {Set<number>} excludedSet
 * @returns {string[]}
 */
export function filterNumbers(numbers, excludedSet) {
  if (!excludedSet || excludedSet.size === 0) return numbers;
  return numbers.filter((n) => !excludedSet.has(parseInt(n, 10)));
}

/**
 * Compute the "middle numbers" for a given range [start, end].
 * Returns an array centered around the midpoint, with a configurable count.
 *
 * @param {number} start
 * @param {number} end
 * @param {number} [count=10] - how many middle numbers to return
 * @returns {number[]}
 */
export function computeMiddleNumbers(start, end, count = 10) {
  if (isNaN(start) || isNaN(end) || start > end) return [];
  const mid = Math.floor((start + end) / 2);
  const half = Math.floor(count / 2);
  const result = [];
  for (let i = mid - half; i <= mid + half; i++) {
    if (i >= start && i <= end) result.push(i);
  }
  return result;
}

/**
 * Clean OCR raw text into an array of number strings.
 * OCR often includes noise like 'O' instead of '0', spaces, etc.
 *
 * @param {string} rawText
 * @returns {string[]}
 */
export function cleanOCRText(rawText) {
  if (!rawText) return [];

  const cleaned = rawText
    .replace(/[Oo]/g, '0')   // common OCR mistake: O → 0
    .replace(/[lI]/g, '1')   // common OCR mistake: l/I → 1
    .replace(/[^0-9\n\s,]/g, ' '); // keep only digits and separators

  const tokens = cleaned
    .split(/[\s,\n]+/)
    .map((t) => t.trim())
    .filter((t) => /^\d{2,6}$/.test(t)); // lottery numbers are usually 2-6 digits

  // De-duplicate
  return [...new Set(tokens)];
}

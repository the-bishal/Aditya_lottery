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
 * Kept for backward compatibility with other modules.
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

// ── OCR Winner Parser ─────────────────────────────────────────────────────────

/**
 * OCR character correction map — common Tesseract misreads.
 */
const OCR_CHAR_MAP = {
  O: '0', o: '0',
  l: '1', I: '1',
  S: '5',
  B: '8',
  G: '6',
  Z: '2',
};

/**
 * Apply OCR character corrections to a string.
 * @param {string} s
 * @returns {string}
 */
function applyOCRCorrections(s) {
  return s
    .split('')
    .map((c) => OCR_CHAR_MAP[c] ?? c)
    .join('');
}

/**
 * Suggest a prize rank based on digit count alone.
 * This is only a suggestion — the user must confirm or override.
 *
 * 5 digits → 2ND (most likely 2nd prize)
 * 4 digits → 3RD (could be 3rd/4th/5th — default to 3rd)
 *
 * @param {string} numberStr - the cleaned digit-only string
 * @returns {string} rank key e.g. '2ND', '3RD', or ''
 */
export function suggestRankByDigitCount(numberStr) {
  const digits = numberStr.replace(/\D/g, '');
  if (digits.length === 5) return '2ND';
  if (digits.length === 4) return '3RD';
  return '';
}

/**
 * Parse OCR raw text for lottery winning numbers.
 *
 * Rules:
 *  - Accept ONLY 4-digit or 5-digit numeric tokens (these are the only valid lottery number lengths)
 *  - Preserve leading zeros (return strings, not integers)
 *  - Apply standard OCR character corrections before extraction
 *  - Do NOT globally deduplicate — return all occurrences so the user can review
 *  - Suggest rank based on digit count (user can always override)
 *  - Assign a confidence score based on how clean the source token was
 *
 * @param {string} rawText - raw string returned by Tesseract.js
 * @returns {Array<{
 *   number: string,
 *   suggestedRank: string,
 *   confidence: number,
 *   raw: string
 * }>}
 */
export function parseOCRForWinners(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];

  const results = [];

  // Split on whitespace/punctuation that is definitely not part of a number.
  // Keep the raw token so we can record what OCR actually saw.
  const rawTokens = rawText.split(/[\s\n\r,;:|]+/).filter(Boolean);

  for (const rawToken of rawTokens) {
    // Apply character corrections
    const corrected = applyOCRCorrections(rawToken);

    // Strip any remaining non-digit characters (dashes, periods, etc.)
    const digitsOnly = corrected.replace(/[^0-9]/g, '');

    // Only accept exactly 4 or 5 digit sequences
    if (digitsOnly.length !== 4 && digitsOnly.length !== 5) continue;

    // Confidence: full if token was already all-digits; reduced if corrections were applied
    const wasAlreadyDigits = /^\d+$/.test(rawToken) && rawToken.length === digitsOnly.length;
    const confidence = wasAlreadyDigits ? 0.95 : 0.70;

    results.push({
      number:        digitsOnly,           // preserved leading zeros
      suggestedRank: suggestRankByDigitCount(digitsOnly),
      confidence,
      raw:           rawToken,             // original OCR token for debugging
    });
  }

  return results;
}

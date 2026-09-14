/**
 * exclusionCodes.js
 *
 * Prize-block exclusion code system.
 *
 * Rule — 5-digit number A B C D E:
 *   exclusion code = digits[1] + digits[2]  (B and C, zero-indexed)
 *   e.g. 10100 → prefix "101" → code "01"
 *        86200 → prefix "862" → code "62"
 *        44700 → prefix "447" → code "47"
 *
 * Rule — 4-digit number A B C D:
 *   exclusion code = digits[0] + digits[1]  (first two digits)
 *   e.g. 4633 → "46"   7628 → "76"
 *
 * Exclusions apply ONLY to auto-generated fill numbers.
 * OCR-detected / manually-entered winners are NEVER filtered.
 */

// ── Core extraction ───────────────────────────────────────────────────────────

/**
 * Extract the 2-digit exclusion code for a single number string.
 *
 * @param {string|number} num
 * @returns {string}  always exactly 2 characters, e.g. "01", "62"
 */
export function extractExclusionCode(num) {
  const s = String(num).replace(/\D/g, ''); // strip any non-digit characters
  if (s.length >= 5) {
    // 5+-digit: code = digits[1] + digits[2]
    return s[1] + s[2];
  }
  if (s.length === 4) {
    // 4-digit: code = digits[0] + digits[1]
    return s[0] + s[1];
  }
  // < 4 digits: not a valid lottery number — return empty string
  return '';
}

/**
 * Check whether a number is excluded by the code set.
 * Returns false for any number with < 4 digits (no valid code).
 *
 * @param {string|number} num
 * @param {Set<string>}   codeSet
 * @returns {boolean}
 */
export function isExcludedByCode(num, codeSet) {
  if (!codeSet || codeSet.size === 0) return false;
  const code = extractExclusionCode(num);
  if (!code) return false;
  return codeSet.has(code);
}

// ── Prize-block parser ────────────────────────────────────────────────────────

/**
 * Parse a pasted prize-block text and return an array of range objects.
 *
 * Accepted formats (all equivalent):
 *   25    10100 - 10199
 *   10    86200 - 86298
 *   44700 - 44798
 *   10100-10199
 *   10100
 *
 * The leading prize-quantity number (if present) is ignored.
 * Only the ranges/numbers that follow matter.
 *
 * @param {string} text
 * @returns {{ start: string, end: string }[]}
 */
export function parsePrizeBlocks(text) {
  if (!text || typeof text !== 'string') return [];

  const results = [];
  const lines = text.split(/[\n;]+/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Strip a leading quantity/prize number if the line has 3+ number tokens.
    // Pattern: optional_leading_digits  RANGE_START  -  RANGE_END
    // We match two multi-digit number tokens separated by a dash (with optional spaces).
    const rangeMatch = line.match(/(\d{3,})\s*-\s*(\d{3,})/);
    if (rangeMatch) {
      results.push({ start: rangeMatch[1], end: rangeMatch[2] });
      continue;
    }

    // Single bare number (no dash)?
    const singleMatch = line.match(/\b(\d{3,})\b/);
    if (singleMatch) {
      results.push({ start: singleMatch[1], end: singleMatch[1] });
    }
  }

  return results;
}

/**
 * Full pipeline: raw pasted text → Set<string> of 2-digit exclusion codes.
 *
 * Each range in the input contributes exactly one code (from its start number).
 * Duplicate codes are automatically deduplicated by the Set.
 *
 * @param {string} text
 * @returns {Set<string>}
 */
export function buildExclusionCodeSet(text) {
  const codeSet = new Set();
  const ranges = parsePrizeBlocks(text);

  for (const { start } of ranges) {
    const code = extractExclusionCode(start);
    if (code) codeSet.add(code);
  }

  return codeSet;
}

/**
 * Return a sorted, deduplicated array of codes for display purposes.
 *
 * @param {Set<string>} codeSet
 * @returns {string[]}
 */
export function codeSetToSortedArray(codeSet) {
  return [...codeSet].sort();
}

/**
 * Given a Set of exclusion codes, filter a candidate number array —
 * for use ONLY during auto-generation, never for OCR / manual input.
 *
 * @param {(string|number)[]} candidates
 * @param {Set<string>}       codeSet
 * @returns {(string|number)[]}
 */
export function filterGeneratedCandidates(candidates, codeSet) {
  if (!codeSet || codeSet.size === 0) return candidates;
  return candidates.filter((n) => !isExcludedByCode(n, codeSet));
}

/**
 * placementEngine.js
 *
 * Pure, stateless placement function for the "Place Winning Numbers" feature.
 *
 * Business rules (from spec):
 *  - 1CR  : series + 5-digit number, qty 1
 *  - 2ND  : exactly 5 digits, max 10
 *  - 3RD  : exactly 4 digits, max 15
 *  - 4TH  : exactly 4 digits, max 15
 *  - 5TH  : exactly 4 digits, max 100
 *
 * Key invariants:
 *  1. Read CURRENT edited OCR entries — never original OCR output.
 *  2. Respect the CURRENT rank each entry is assigned to.
 *  3. Do not overwrite existing manually-placed numbers.
 *  4. Append only, deduplicate within each rank.
 *  5. Respect exact rank capacities; report overflow clearly.
 *  6. OCR/manual winners are NEVER filtered by exclusion codes.
 *  7. Operation is idempotent — safe to call multiple times.
 */

// ── Constants ──────────────────────────────────────────────────────────────────

export const RANK_CAPACITIES = {
  '1CR': 1,
  '2ND': 10,
  '3RD': 15,
  '4TH': 15,
  '5TH': 100,
};

export const RANK_LABELS = {
  '1CR': '1 Crore',
  '2ND': '2nd Prize',
  '3RD': '3rd Prize',
  '4TH': '4th Prize',
  '5TH': '5th Prize',
};

export const ALL_RANKS = ['1CR', '2ND', '3RD', '4TH', '5TH'];

// ── Validation ─────────────────────────────────────────────────────────────────

/**
 * Validate a number string against the expected format for a rank.
 *
 * 1CR  : matches "SERIES NNNNN" (letters + space/dash + 5 digits) OR bare 5+ digits
 * 2ND  : exactly 5 digits
 * 3RD  : exactly 4 digits
 * 4TH  : exactly 4 digits
 * 5TH  : exactly 4 digits
 *
 * @param {string} number   - the number string (already trimmed)
 * @param {string} rank     - one of '1CR','2ND','3RD','4TH','5TH'
 * @returns {{ valid: boolean, reason: string }}
 */
export function validateNumberForRank(number, rank) {
  if (!number || typeof number !== 'string') {
    return { valid: false, reason: 'Empty or invalid number' };
  }
  const s = number.trim();

  switch (rank) {
    case '1CR': {
      // Accept: "AB12345", "AB 12345", "AB-12345", or bare "12345"
      const crPattern = /^([A-Za-z]{1,3}[\s-]?)?\d{5}$/;
      if (crPattern.test(s)) return { valid: true, reason: '' };
      return { valid: false, reason: `1CR must be a series + 5-digit number (e.g. "AB 12345" or "12345")` };
    }
    case '2ND': {
      if (/^\d{5}$/.test(s)) return { valid: true, reason: '' };
      return {
        valid: false,
        reason: `2nd Prize requires exactly 5 digits (got "${s}" — ${s.replace(/\D/g, '').length} digit(s))`,
      };
    }
    case '3RD':
    case '4TH':
    case '5TH': {
      const digits = s.replace(/\D/g, '');
      if (/^\d{4}$/.test(s)) return { valid: true, reason: '' };
      return {
        valid: false,
        reason: `${rank} requires exactly 4 digits (got "${s}" — ${digits.length} digit(s))`,
      };
    }
    default:
      return { valid: false, reason: `Unknown rank "${rank}"` };
  }
}

// ── Core placement function ────────────────────────────────────────────────────

/**
 * Place OCR entries into rank arrays.
 *
 * @param {Array<{
 *   id: string|number,
 *   number: string,
 *   rank: string,
 *   source?: string,
 *   edited?: boolean
 * }>} currentOcrEntries - the CURRENT user-edited OCR entry list (source of truth)
 *
 * @param {{
 *   '1CR': string[],
 *   '2ND': string[],
 *   '3RD': string[],
 *   '4TH': string[],
 *   '5TH': string[]
 * }} currentRankArrays - current state of each rank's placed numbers
 *
 * @returns {{
 *   rankArrays: typeof currentRankArrays,  // updated (immutable copy)
 *   placed: Array<{number, rank}>,
 *   skipped: Array<{number, rank, reason}>,
 *   invalid: Array<{number, rank, reason, entryIndex}>,
 *   capacityExceeded: Array<{number, rank, reason}>
 * }}
 */
export function placeWinners(currentOcrEntries, currentRankArrays) {
  // Deep-copy rank arrays so we never mutate the original state
  const newRankArrays = {};
  for (const rank of ALL_RANKS) {
    newRankArrays[rank] = [...(currentRankArrays[rank] ?? [])];
  }

  const placed           = [];
  const skipped          = [];
  const invalid          = [];
  const capacityExceeded = [];

  currentOcrEntries.forEach((entry, idx) => {
    const number = (entry.number ?? '').trim();
    const rank   = (entry.rank  ?? '').trim().toUpperCase();

    // Skip entries with no rank assigned
    if (!rank) {
      skipped.push({ number, rank: '(none)', reason: 'No rank assigned — skipped' });
      return;
    }

    // Skip unknown ranks
    if (!ALL_RANKS.includes(rank)) {
      skipped.push({ number, rank, reason: `Unknown rank "${rank}"` });
      return;
    }

    // Validate number format for the assigned rank
    const { valid, reason } = validateNumberForRank(number, rank);
    if (!valid) {
      invalid.push({ number, rank, reason, entryIndex: idx + 1 });
      return;
    }

    // Normalize to uppercase for consistency
    const normalizedNumber = number.trim();

    // Duplicate check — within this rank only
    if (newRankArrays[rank].includes(normalizedNumber)) {
      skipped.push({ number: normalizedNumber, rank, reason: 'Duplicate within rank' });
      return;
    }

    // Capacity check
    const capacity = RANK_CAPACITIES[rank];
    if (newRankArrays[rank].length >= capacity) {
      capacityExceeded.push({
        number: normalizedNumber,
        rank,
        reason: `${RANK_LABELS[rank]} is full (max ${capacity})`,
      });
      return;
    }

    // All checks passed — place it
    newRankArrays[rank].push(normalizedNumber);
    placed.push({ number: normalizedNumber, rank });
  });

  return { rankArrays: newRankArrays, placed, skipped, invalid, capacityExceeded };
}

// ── Rank array helpers ─────────────────────────────────────────────────────────

/**
 * Parse a textarea string into an array of trimmed, non-empty number strings.
 * Handles newline, comma, and space separators.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function parseRankTextarea(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .split(/[\n,\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Serialize a rank array back to a textarea string (one number per line).
 *
 * @param {string[]} arr
 * @returns {string}
 */
export function serializeRankArray(arr) {
  return (arr ?? []).join('\n');
}

/**
 * Count the actual filled slots in a rank array.
 * Always computed from the real array — never from counters.
 *
 * @param {string[]} arr
 * @returns {number}
 */
export function countFilled(arr) {
  return (arr ?? []).filter((n) => n.trim() !== '').length;
}

/**
 * Build a human-readable placement summary.
 *
 * @param {ReturnType<typeof placeWinners>} result
 * @returns {string[]} array of summary lines
 */
export function buildPlacementSummary(result) {
  const lines = [];
  if (result.placed.length > 0) {
    lines.push(`✓ Placed ${result.placed.length} winner${result.placed.length !== 1 ? 's' : ''}`);
  }
  if (result.skipped.length > 0) {
    const dupCount = result.skipped.filter((s) => s.reason.includes('Duplicate')).length;
    const noRank   = result.skipped.filter((s) => s.reason.includes('No rank')).length;
    if (dupCount > 0) lines.push(`⟳ Skipped ${dupCount} duplicate${dupCount !== 1 ? 's' : ''}`);
    if (noRank > 0)   lines.push(`— Skipped ${noRank} unranked entr${noRank !== 1 ? 'ies' : 'y'}`);
  }
  if (result.invalid.length > 0) {
    lines.push(`✗ ${result.invalid.length} invalid entr${result.invalid.length !== 1 ? 'ies' : 'y'} (wrong digit count for rank)`);
  }
  if (result.capacityExceeded.length > 0) {
    lines.push(`⚠ ${result.capacityExceeded.length} entr${result.capacityExceeded.length !== 1 ? 'ies' : 'y'} could not be placed — rank full`);
  }
  return lines;
}

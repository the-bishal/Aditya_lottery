/**
 * middleNumbersEngine.js
 *
 * Core mathematical engine for Middle Numbers set generation,
 * validation, verification, and clipboard formatting.
 *
 * Standard Set Prize Structure (8 rows per set):
 *   1. 200 — 10 tickets (suffix 00-09 or 50-59)
 *   2. 100 — 40 tickets (suffix 00-39 or 50-89)
 *   3. 50  — 50 tickets (suffix 00-49 or 50-99)
 *   4. 25  — 100 tickets (suffix 00-99)
 *   5. 10  — First 10-prize range (suffix 00-98, even numbers)
 *   6. 10  — Second 10-prize range (suffix 00-98, even numbers)
 *   7. 5   — First 5-prize range (suffix 00-95, step 5)
 *   8. 5   — Second 5-prize range (suffix 00-95, step 5)
 */

export const PRIZE_TIERS = [
  { prize: '200', id: '200_1', label: '200', type: 'block_10' },
  { prize: '100', id: '100_1', label: '100', type: 'block_40' },
  { prize: '50',  id: '50_1',  label: '50',  type: 'block_50' },
  { prize: '25',  id: '25_1',  label: '25',  type: 'block_100' },
  { prize: '10',  id: '10_1',  label: '10',  type: 'even_100' },
  { prize: '10',  id: '10_2',  label: '10',  type: 'even_100' },
  { prize: '5',   id: '5_1',   label: '5',   type: 'step5_100' },
  { prize: '5',   id: '5_2',   label: '5',   type: 'step5_100' },
];

/**
 * Generate start and end 5-digit strings for a given 3-digit prefix and tier type.
 *
 * @param {string} prefix - 3-digit string, e.g. "701"
 * @param {string} type - one of PRIZE_TIERS types
 * @returns {{ start: string, end: string, count: number }}
 */
export function generateRangeForTier(prefix, type) {
  const p = String(prefix).padStart(3, '0');

  switch (type) {
    case 'block_10': {
      // 10 numbers: start at 50 or 00
      const startSuffix = Math.random() < 0.5 ? 50 : 0;
      const endSuffix = startSuffix + 9;
      return {
        start: `${p}${String(startSuffix).padStart(2, '0')}`,
        end:   `${p}${String(endSuffix).padStart(2, '0')}`,
        count: 10,
      };
    }
    case 'block_40': {
      // 40 numbers: start at 00 (end 39) or 50 (end 89)
      const startSuffix = Math.random() < 0.5 ? 0 : 50;
      const endSuffix = startSuffix + 39;
      return {
        start: `${p}${String(startSuffix).padStart(2, '0')}`,
        end:   `${p}${String(endSuffix).padStart(2, '0')}`,
        count: 40,
      };
    }
    case 'block_50': {
      // 50 numbers: start at 50 (end 99) or 00 (end 49)
      const startSuffix = Math.random() < 0.5 ? 50 : 0;
      const endSuffix = startSuffix + 49;
      return {
        start: `${p}${String(startSuffix).padStart(2, '0')}`,
        end:   `${p}${String(endSuffix).padStart(2, '0')}`,
        count: 50,
      };
    }
    case 'block_100': {
      // 100 numbers: 00 to 99
      return {
        start: `${p}00`,
        end:   `${p}99`,
        count: 100,
      };
    }
    case 'even_100': {
      // Suffix 00 to 98
      return {
        start: `${p}00`,
        end:   `${p}98`,
        count: 50, // 50 even numbers
      };
    }
    case 'step5_100': {
      // Suffix 00 to 95
      return {
        start: `${p}00`,
        end:   `${p}95`,
        count: 20, // 20 multiples of 5
      };
    }
    default:
      throw new Error(`Unknown tier type: ${type}`);
  }
}

/**
 * Generate N complete Middle Number sets.
 *
 * @param {number} setCount - integer from 1 to 100
 * @param {object} [options]
 * @param {Set<string>} [options.excludedCodeSet] - optional 2-digit exclusion codes to skip
 * @returns {{ sets: Array, error?: string }}
 */
export function generateMiddleSets(setCount, options = {}) {
  // Check for decimal numbers or strings containing decimals
  if (typeof setCount === 'number' && !Number.isInteger(setCount)) {
    return { sets: [], error: 'Number of sets must be a whole integer, not a decimal.' };
  }
  if (typeof setCount === 'string' && (setCount.includes('.') || setCount.includes(','))) {
    return { sets: [], error: 'Number of sets must be a whole integer, not a decimal.' };
  }

  const n = parseInt(setCount, 10);
  if (isNaN(n) || n <= 0) {
    return { sets: [], error: 'Number of sets must be a positive integer (at least 1).' };
  }
  if (n > 100) {
    return { sets: [], error: 'Maximum 100 sets can be generated at a time.' };
  }

  const { excludedCodeSet = null } = options;
  const rowsPerSet = PRIZE_TIERS.length; // 8 rows
  const totalPrefixesNeeded = n * rowsPerSet;

  // Pool of all 3-digit prefixes from 000 to 999
  const candidatePrefixes = [];
  for (let i = 0; i <= 999; i++) {
    const pStr = String(i).padStart(3, '0');
    // If exclusion codes are provided, check if prefix code (digits[1]+digits[2]) is excluded
    if (excludedCodeSet && excludedCodeSet.size > 0) {
      // For 5-digit number starting with prefix pStr, code is pStr[1] + pStr[2]
      const code = pStr[1] + pStr[2];
      if (excludedCodeSet.has(code)) continue;
    }
    candidatePrefixes.push(pStr);
  }

  if (candidatePrefixes.length < totalPrefixesNeeded) {
    return {
      sets: [],
      error: `Not enough unique middle numbers available (needed ${totalPrefixesNeeded}, available ${candidatePrefixes.length}).`,
    };
  }

  // Fisher-Yates shuffle to randomly pick non-overlapping prefixes
  for (let i = candidatePrefixes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidatePrefixes[i], candidatePrefixes[j]] = [candidatePrefixes[j], candidatePrefixes[i]];
  }

  const selectedPrefixes = candidatePrefixes.slice(0, totalPrefixesNeeded);
  const sets = [];
  let prefixIdx = 0;

  for (let s = 1; s <= n; s++) {
    const rows = [];
    for (const tier of PRIZE_TIERS) {
      const prefix = selectedPrefixes[prefixIdx++];
      const range = generateRangeForTier(prefix, tier.type);
      rows.push({
        prize: tier.prize,
        id: tier.id,
        prefix,
        start: range.start,
        end: range.end,
        count: range.count,
        type: tier.type,
      });
    }
    sets.push({
      setNumber: s,
      rows,
    });
  }

  return { sets };
}

/**
 * Validate and verify that generated sets satisfy all business rules.
 *
 * @param {Array} sets
 * @param {number} expectedCount
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function verifyMiddleSets(sets, expectedCount) {
  const errors = [];

  if (!Array.isArray(sets) || sets.length === 0) {
    return { isValid: false, errors: ['No sets generated.'] };
  }

  if (sets.length !== expectedCount) {
    errors.push(`Set count mismatch: expected ${expectedCount}, got ${sets.length}.`);
  }

  const globalPrefixes = new Set();
  const globalRanges = [];

  sets.forEach((set, sIdx) => {
    const setNum = set.setNumber || sIdx + 1;

    if (!Array.isArray(set.rows)) {
      errors.push(`Set ${setNum}: rows array missing.`);
      return;
    }

    if (set.rows.length !== PRIZE_TIERS.length) {
      errors.push(`Set ${setNum}: expected ${PRIZE_TIERS.length} rows, found ${set.rows.length}.`);
    }

    // Verify row structure and tiers
    PRIZE_TIERS.forEach((expectedTier, rIdx) => {
      const row = set.rows[rIdx];
      if (!row) {
        errors.push(`Set ${setNum}: missing row ${expectedTier.prize} at index ${rIdx}.`);
        return;
      }

      if (row.prize !== expectedTier.prize) {
        errors.push(`Set ${setNum}, Row ${rIdx + 1}: expected prize ${expectedTier.prize}, got ${row.prize}.`);
      }

      // Check prefix format
      if (!/^\d{3}$/.test(row.prefix)) {
        errors.push(`Set ${setNum}, Row ${rIdx + 1}: invalid 3-digit prefix "${row.prefix}".`);
      }

      // Check start/end format (5 digits)
      if (!/^\d{5}$/.test(row.start) || !/^\d{5}$/.test(row.end)) {
        errors.push(`Set ${setNum}, Row ${rIdx + 1}: numbers must be exactly 5 digits (${row.start} - ${row.end}).`);
      }

      const sNum = parseInt(row.start, 10);
      const eNum = parseInt(row.end, 10);

      if (isNaN(sNum) || isNaN(eNum) || sNum > eNum) {
        errors.push(`Set ${setNum}, Row ${rIdx + 1}: start must be <= end (${row.start} - ${row.end}).`);
      }

      // Prefix match check
      if (!row.start.startsWith(row.prefix) || !row.end.startsWith(row.prefix)) {
        errors.push(`Set ${setNum}, Row ${rIdx + 1}: start or end does not start with prefix ${row.prefix}.`);
      }

      // Duplicate prefix check
      if (globalPrefixes.has(row.prefix)) {
        errors.push(`Duplicate middle number prefix "${row.prefix}" found in Set ${setNum}, Row ${rIdx + 1}.`);
      }
      globalPrefixes.add(row.prefix);

      // Overlap check
      for (const existing of globalRanges) {
        if (!(eNum < existing.start || sNum > existing.end)) {
          errors.push(`Range overlap detected: ${row.start}-${row.end} overlaps with ${existing.start}-${existing.end}.`);
        }
      }
      globalRanges.push({ start: sNum, end: eNum, label: `${setNum}:${row.prize}` });
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format sets into the standardized operational text representation.
 *
 * Example output:
 *   NEW 5 SETS (Verified)
 *
 *   1
 *
 *   200    70150 - 70159
 *   100    63700 - 63739
 *   50     52050 - 52099
 *   25     76200 - 76299
 *   10     95800 - 95898
 *   10     62300 - 62398
 *   5      99600 - 99695
 *   5      98400 - 98495
 *
 *   2
 *   ...
 *
 * @param {Array} sets
 * @param {boolean} [isVerified=true]
 * @returns {string}
 */
export function formatSetsForClipboard(sets, isVerified = true) {
  if (!Array.isArray(sets) || sets.length === 0) return '';

  const header = `NEW ${sets.length} SETS${isVerified ? ' (Verified)' : ''}`;
  const sections = [header];

  sets.forEach((set) => {
    const lines = [];
    lines.push(`${set.setNumber}\n`);

    set.rows.forEach((row) => {
      // Pad prize column to 7 spaces for aligned tabular columns
      const prizeCol = String(row.prize).padEnd(7, ' ');
      lines.push(`${prizeCol}${row.start} - ${row.end}`);
    });

    sections.push(lines.join('\n'));
  });

  return sections.join('\n\n');
}

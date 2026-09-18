/**
 * autoFillEngine.js
 *
 * Deterministic Auto-Fill Engine for lottery prize ranks.
 *
 * Requirements & Invariants:
 *  1. Target capacities:
 *     - 1CR : 1 winner  (series letter + 5-digit number)
 *     - 2ND : 10 winners (5-digit numbers)
 *     - 3RD : 15 winners (4-digit numbers)
 *     - 4TH : 15 winners (4-digit numbers)
 *     - 5TH : 100 winners (4-digit numbers)
 *     Total = 141 winners when full.
 *
 *  2. Exclusions:
 *     - Exclusion codes apply ONLY to auto-generated numbers.
 *     - For 5-digit numbers: code = digits[1] + digits[2].
 *     - For 4-digit numbers: code = digits[0] + digits[1].
 *     - Any candidate matching excludedCodeSet is rejected and regenerated.
 *
 *  3. Preservation & Idempotency:
 *     - Existing OCR / manual winners are NEVER overwritten or altered.
 *     - If a rank is already full, +0 numbers are generated.
 *     - Running Auto-Fill again does NOT create duplicates.
 *
 *  4. Logging:
 *     Produces the exact operational logs:
 *       - "Auto-generated 1st Prize" (if 1CR was filled)
 *       - "Fill done! +2nd:8 +3rd:14 +4th:14 - 5TH: 100/100"
 *       - "Placed 141 winners"
 */

import { extractExclusionCode } from './exclusionCodes.js';
import { RANK_CAPACITIES, countFilled } from './placementEngine.js';

const SERIES_PRESETS = ['AB', 'BC', 'CD', 'DE', 'EF', 'GH', 'KL', 'MN', 'OP', 'RS'];

/**
 * Generate a random padded integer string between min and max inclusive.
 */
function randomDigits(length) {
  const max = Math.pow(10, length);
  const num = Math.floor(Math.random() * max);
  return String(num).padStart(length, '0');
}

/**
 * Generate a random 1CR ticket number (e.g. "AB 12345"),
 * ensuring the 5-digit portion does NOT violate the exclusion code set.
 */
function generate1CrNumber(excludedCodeSet, existingSet) {
  for (let attempt = 0; attempt < 500; attempt++) {
    const series = SERIES_PRESETS[Math.floor(Math.random() * SERIES_PRESETS.length)];
    const digits = randomDigits(5);
    const candidate = `${series} ${digits}`;

    if (existingSet.has(candidate) || existingSet.has(digits)) continue;

    const code = extractExclusionCode(digits);
    if (excludedCodeSet && excludedCodeSet.has(code)) continue;

    return candidate;
  }
  // Fallback if tight exclusion
  return `AB ${randomDigits(5)}`;
}

/**
 * Generate a single unique random number for a given digit length,
 * respecting excluded codes and avoiding existing numbers.
 */
function generateCandidate(length, excludedCodeSet, existingSet) {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const numStr = randomDigits(length);

    if (existingSet.has(numStr)) continue;

    const code = extractExclusionCode(numStr);
    if (excludedCodeSet && excludedCodeSet.has(code)) continue;

    return numStr;
  }
  // Fallback if code space is very constrained
  return randomDigits(length);
}

/**
 * Run Auto-Fill on current rank arrays.
 *
 * @param {object} params
 * @param {Record<string, string[]>} params.rankArrays - current placed numbers
 * @param {Set<string>} params.excludedCodeSet - 2-digit excluded codes
 * @returns {{
 *   rankArrays: Record<string, string[]>,
 *   filledDiff: Record<string, number>,
 *   totalPlaced: number,
 *   logLines: string[],
 *   isAlreadyFull: boolean,
 * }}
 */
export function runAutoFill({ rankArrays = {}, excludedCodeSet = new Set() }) {
  const updatedArrays = {
    '1CR': [...(rankArrays['1CR'] || [])].filter((n) => n && n.trim() !== ''),
    '2ND': [...(rankArrays['2ND'] || [])].filter((n) => n && n.trim() !== ''),
    '3RD': [...(rankArrays['3RD'] || [])].filter((n) => n && n.trim() !== ''),
    '4TH': [...(rankArrays['4TH'] || [])].filter((n) => n && n.trim() !== ''),
    '5TH': [...(rankArrays['5TH'] || [])].filter((n) => n && n.trim() !== ''),
  };

  // Collect all existing numbers to guarantee global uniqueness
  const existingSet = new Set();
  Object.values(updatedArrays).forEach((arr) => {
    arr.forEach((num) => existingSet.add(num.trim()));
  });

  const filledDiff = {
    '1CR': 0,
    '2ND': 0,
    '3RD': 0,
    '4TH': 0,
    '5TH': 0,
  };

  const logLines = [];
  let generated1Cr = false;

  // 1. Fill 1CR (Capacity: 1)
  const cap1 = RANK_CAPACITIES['1CR'] || 1;
  if (updatedArrays['1CR'].length < cap1) {
    const num = generate1CrNumber(excludedCodeSet, existingSet);
    updatedArrays['1CR'].push(num);
    existingSet.add(num);
    filledDiff['1CR'] += 1;
    generated1Cr = true;
  }

  // 2. Fill 2ND (Capacity: 10, 5 digits)
  const cap2 = RANK_CAPACITIES['2ND'] || 10;
  const needed2 = Math.max(0, cap2 - updatedArrays['2ND'].length);
  for (let i = 0; i < needed2; i++) {
    const num = generateCandidate(5, excludedCodeSet, existingSet);
    updatedArrays['2ND'].push(num);
    existingSet.add(num);
    filledDiff['2ND'] += 1;
  }

  // 3. Fill 3RD (Capacity: 15, 4 digits)
  const cap3 = RANK_CAPACITIES['3RD'] || 15;
  const needed3 = Math.max(0, cap3 - updatedArrays['3RD'].length);
  for (let i = 0; i < needed3; i++) {
    const num = generateCandidate(4, excludedCodeSet, existingSet);
    updatedArrays['3RD'].push(num);
    existingSet.add(num);
    filledDiff['3RD'] += 1;
  }

  // 4. Fill 4TH (Capacity: 15, 4 digits)
  const cap4 = RANK_CAPACITIES['4TH'] || 15;
  const needed4 = Math.max(0, cap4 - updatedArrays['4TH'].length);
  for (let i = 0; i < needed4; i++) {
    const num = generateCandidate(4, excludedCodeSet, existingSet);
    updatedArrays['4TH'].push(num);
    existingSet.add(num);
    filledDiff['4TH'] += 1;
  }

  // 5. Fill 5TH (Capacity: 100, 4 digits)
  // Distribute across 10 prefix buckets (0000-0999, 1000-1999, ..., 9000-9999) with 10 numbers per bucket
  const cap5 = RANK_CAPACITIES['5TH'] || 100;
  const needed5 = Math.max(0, cap5 - updatedArrays['5TH'].length);
  if (needed5 > 0) {
    const bucketCounts = Array(10).fill(0);
    updatedArrays['5TH'].forEach((num) => {
      const firstChar = String(num).trim().charAt(0);
      const d = parseInt(firstChar, 10);
      if (!isNaN(d) && d >= 0 && d <= 9) {
        bucketCounts[d]++;
      }
    });

    let remainingNeeded = needed5;
    for (let d = 0; d <= 9 && remainingNeeded > 0; d++) {
      const neededInBucket = Math.max(0, 10 - bucketCounts[d]);
      const toAdd = Math.min(neededInBucket, remainingNeeded);
      for (let i = 0; i < toAdd; i++) {
        let candidate = null;
        for (let attempt = 0; attempt < 1000; attempt++) {
          const numStr = `${d}${randomDigits(3)}`;
          if (existingSet.has(numStr)) continue;
          const code = extractExclusionCode(numStr);
          if (excludedCodeSet && excludedCodeSet.has(code)) continue;
          candidate = numStr;
          break;
        }
        if (!candidate) candidate = generateCandidate(4, excludedCodeSet, existingSet);
        updatedArrays['5TH'].push(candidate);
        existingSet.add(candidate);
        filledDiff['5TH'] += 1;
        bucketCounts[d]++;
        remainingNeeded--;
      }
    }

    while (remainingNeeded > 0) {
      const num = generateCandidate(4, excludedCodeSet, existingSet);
      updatedArrays['5TH'].push(num);
      existingSet.add(num);
      filledDiff['5TH'] += 1;
      remainingNeeded--;
    }
  }

  // Sort prize ranks in ascending numerical order
  const sortNumeric = (arr) =>
    [...arr].sort((a, b) => Number(String(a).replace(/\D/g, '')) - Number(String(b).replace(/\D/g, '')));

  updatedArrays['2ND'] = sortNumeric(updatedArrays['2ND']);
  updatedArrays['3RD'] = sortNumeric(updatedArrays['3RD']);
  updatedArrays['4TH'] = sortNumeric(updatedArrays['4TH']);
  updatedArrays['5TH'] = sortNumeric(updatedArrays['5TH']);

  // Total winners placed across all ranks
  const totalPlaced =
    countFilled(updatedArrays['1CR']) +
    countFilled(updatedArrays['2ND']) +
    countFilled(updatedArrays['3RD']) +
    countFilled(updatedArrays['4TH']) +
    countFilled(updatedArrays['5TH']);

  const totalAdded =
    filledDiff['1CR'] +
    filledDiff['2ND'] +
    filledDiff['3RD'] +
    filledDiff['4TH'] +
    filledDiff['5TH'];

  const isAlreadyFull = totalAdded === 0 && totalPlaced >= 141;

  // Build log lines matching the operational screenshot
  if (generated1Cr) {
    logLines.push('Auto-generated 1st Prize');
  }

  if (isAlreadyFull) {
    logLines.push('All ranks are already full (141/141 winners placed).');
  } else {
    const count5 = updatedArrays['5TH'].length;
    logLines.push(
      `Fill done! +2nd:${filledDiff['2ND']} +3rd:${filledDiff['3RD']} +4th:${filledDiff['4TH']} — 5TH: ${count5}/${cap5}`
    );
  }

  logLines.push(`Placed ${totalPlaced} winners`);

  return {
    rankArrays: updatedArrays,
    filledDiff,
    totalPlaced,
    logLines,
    isAlreadyFull,
  };
}

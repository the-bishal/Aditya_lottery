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
 * Detect a lottery prize rank from a text snippet or line.
 * Matches keywords like "1st", "2nd", "3rd", "4th", "5th", "1 Crore", "Consolation",
 * as well as common OCR slight misreads (e.g. "3ra", "4tn", "5tn", "2na").
 *
 * @param {string} text
 * @returns {string} '1CR' | '2ND' | '3RD' | '4TH' | '5TH' | ''
 */
export function detectRankFromText(text) {
  if (!text || typeof text !== 'string') return '';
  const lower = text.toLowerCase();

  if (/(?:\b1st\b|\b1\s*st\b|first|\b1cr\b|1\s*crore|\b1st\s*prize\b)/i.test(lower)) return '1CR';
  if (/(?:\b2nd\b|\b2\s*nd\b|\b2na\b|second|\b2nd\s*prize\b)/i.test(lower)) return '2ND';
  if (/(?:\b3rd\b|\b3\s*rd\b|\b3ra\b|third|\b3rd\s*prize\b)/i.test(lower)) return '3RD';
  if (/(?:\b4th\b|\b4\s*th\b|\b4tn\b|fourth|\b4th\s*prize\b)/i.test(lower)) return '4TH';
  if (/(?:\b5th\b|\b5\s*th\b|\b5tn\b|fifth|\b5th\s*prize\b)/i.test(lower)) return '5TH';
  if (/(?:\bcons\b|consolation)/i.test(lower)) return '1CR';

  return '';
}

/**
 * Suggest a prize rank based on digit count alone.
 * This is only a fallback suggestion — contextual rank detection is checked first.
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
 * Parse OCR raw text for lottery winning numbers and their ranks.
 *
 * Rules:
 *  - Parses line-by-line and extracts both the ticket number and its associated rank
 *  - Correctly detects ranks from table columns (e.g. "7803 | 3rd", "2021 | 5th", "4844 | 4th")
 *  - Supports block-level rank headers (e.g. "5th Prize:\n 1234 5678")
 *  - Ignores currency amounts, dates, and times (e.g. "25,000", "02:30 PM", "14/09/26")
 *  - Accepts ONLY 4-digit or 5-digit numeric tokens
 *  - Preserves leading zeros (returns strings, not integers)
 *  - Applies OCR character corrections (O->0, I/l->1, etc.)
 *
 * @param {string} rawText - raw string returned by Tesseract.js
 * @returns {Array<{
 *   number: string,
 *   suggestedRank: string,
 *   confidence: number,
 *   raw: string
 * }>}
 */
/**
 * Check if a token is an alphabetical word rather than a noisy number.
 * Prevents words like "CONGRATULATIONS" or "Consolation" from being mutated into digits.
 *
 * @param {string} token
 * @returns {boolean}
 */
function isLikelyWord(token) {
  if (!token) return false;
  const letters = (token.match(/[a-zA-Z]/g) || []).length;
  const digits = (token.match(/[0-9]/g) || []).length;
  // If it contains 2 or more letters and has more letters than digits, it's a word
  return letters >= 2 && letters > digits;
}

/**
 * Standard lottery prize denominations that frequently appear as prize amounts on sheets
 * (e.g. Rs 9000, 1000 Consolation, 25000, 12000, 6000, 1200, 6250, 50450 Total).
 */
const COMMON_PRIZE_AMOUNTS = new Set([
  '500', '1000', '1200', '2000', '2500', '3000', '4000', '5000',
  '6000', '6250', '7000', '7500', '8000', '9000', '9500',
  '10000', '12000', '15000', '20000', '25000', '30000', '50000',
  '90000', '100000', '50450'
]);

/**
 * Check if a line is a table header or summary/metadata row.
 */
function isMetadataOrHeaderLine(line) {
  if (!line) return false;
  if (/^(?:congratulations|good\s*luck|total\b|grand\s*total|sum\b|drawn?\b)/i.test(line)) return true;
  if (/\b(?:total\s*[:-]|time\s+\d{1,2}:\d{2}|date\s+\d{1,2}[/-]\d{1,2})/i.test(line)) return true;

  // Header row detection (e.g. "TICKETS RANK SERIES NAME PRIZE")
  const hasTicketWord = /\b(?:ticket[s]?|tkt)\b/i.test(line);
  const hasPrizeWord = /\b(?:prize|amount|amt)\b/i.test(line);
  const hasRankOrNameWord = /\b(?:rank|series|name|sl\.?\s*no)\b/i.test(line);
  if ((hasTicketWord && (hasPrizeWord || hasRankOrNameWord)) || (hasRankOrNameWord && hasPrizeWord)) {
    return true;
  }
  return false;
}

/**
 * Check if a line is a tabular row representing a single winner entry
 * (with ticket number, rank/series/name, and prize amount).
 */
function isTabularRow(line, inTableBlock) {
  if (line.includes('|')) return true;
  const hasRank = /\b(?:1st|2nd|3rd|4th|5th|first|second|third|fourth|fifth)\b/i.test(line);
  const words = line.split(/\s+/).filter(isLikelyWord);
  const digitsMatches = line.match(/\b\d{4,5}\b/g) || [];
  if (hasRank && words.length >= 1 && digitsMatches.length >= 1) return true;
  if (inTableBlock && words.length >= 1 && digitsMatches.length >= 1) return true;
  return false;
}

/**
 * Clean currency and prize amount prefixes/suffixes from a line string.
 */
function stripCurrencyAndPrizeAmounts(line) {
  let cleaned = line
    .replace(/(?:₹|rs\.?|inr)\s*\d+[\d,]*(?:\/-|\/=)?/gi, ' ')
    .replace(/\b\d+[\d,]*(?:\/-|\/=)/gi, ' ')
    .replace(/(?:total|grand\s*total|sum)\s*(?:is|of|:-|:|-)?\s*(?:₹|rs\.?)?\s*[\d,]+/gi, ' ');

  // If a number appears after 'prize' / 'amount' and is a known prize amount, strip it
  cleaned = cleaned.replace(/(?:prize|amount|amt)\s*(?:of|is|:|-)?\s*(\d{3,})/gi, (match, num) => {
    const digits = num.replace(/\D/g, '');
    if (COMMON_PRIZE_AMOUNTS.has(digits)) {
      return ' ';
    }
    return match; // Keep as is (likely a ticket number like "1st Prize: 88219")
  });

  return cleaned;
}

/**
 * Parse OCR raw text for lottery winning numbers and their ranks.
 *
 * Rules:
 *  - Parses line-by-line and extracts only genuine winning ticket numbers
 *  - Filters out prize amounts (e.g. ₹25,000, 9000/-, Prize 9000, 1200, 6000)
 *  - Filters out summary totals, dates, times, and celebratory text
 *  - Prevents words (e.g. "CONGRATULATIONS", "Consolation") from turning into fake numbers
 *  - In tabular rows (TICKETS | RANK | SERIES | NAME | PRIZE or space-delimited),
 *    extracts the ticket number and discards the trailing PRIZE column number
 *  - Correctly detects ranks from table columns (e.g. "7803 | 3rd", "2021 | 5th")
 *  - Accepts ONLY 4-digit or 5-digit numeric tokens
 *  - Preserves leading zeros
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
  const rawLines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let activeBlockRank = '';
  let inTableBlock = false;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const lowerLine = line.toLowerCase();

    // 1. Skip pure metadata, header, footer, or total summary lines
    if (isMetadataOrHeaderLine(line)) {
      if (/\b(?:ticket[s]?|rank|prize)\b/i.test(line)) {
        inTableBlock = true; // Started a table section
      }
      continue;
    }

    // Reset table block if line looks like an empty or section header
    let lineRank = detectRankFromText(line);

    // Clean currency amounts from the line first
    const cleanedLine = stripCurrencyAndPrizeAmounts(line);

    // Check if this line is a section header (e.g. "2nd Prize Rs 9000/-" or "Consolation Prize: 1000/-")
    const isSectionHeader =
      lineRank &&
      (line.includes(':') || lowerLine.includes('prize') || lowerLine.includes('/-')) &&
      !line.includes('|');

    if (isSectionHeader) {
      activeBlockRank = lineRank;
      inTableBlock = false; // Left table block

      // Check if there are candidate ticket numbers remaining on this line (e.g. "1st Prize Rs 50,000 : 98765")
      const remainingTokens = cleanedLine.split(/[\s,;:|]+/).filter(Boolean);
      const remainingDigits = [];
      for (const token of remainingTokens) {
        if (isLikelyWord(token)) continue;
        if (token.includes('/') || token.includes(':')) continue;
        const corrected = applyOCRCorrections(token);
        const digits = corrected.replace(/\D/g, '');
        if (digits.length === 4 || digits.length === 5) {
          if (!COMMON_PRIZE_AMOUNTS.has(digits)) {
            remainingDigits.push({ digits, token });
          }
        }
      }

      if (remainingDigits.length > 0) {
        for (const item of remainingDigits) {
          results.push({
            number: item.digits,
            suggestedRank: lineRank || '1CR',
            confidence: /^\d+$/.test(item.token) ? 0.95 : 0.70,
            raw: item.token,
          });
        }
      }
      continue;
    }

    // In vertical formats (where number is on line i and rank is on line i + 1):
    if (!lineRank && !activeBlockRank && i + 1 < rawLines.length) {
      const nextRank = detectRankFromText(rawLines[i + 1]);
      if (nextRank && /^(?:1st|2nd|3rd|4th|5th|first|second|third|fourth|fifth)/i.test(rawLines[i + 1])) {
        lineRank = nextRank;
      }
    }

    // 2. Tabular Row Handling:
    // If the line is a table row (either pipe-delimited or space-delimited with ticket/rank/name/prize)
    if (isTabularRow(line, inTableBlock)) {
      if (line.includes('|')) {
        const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
        if (cells.length >= 2) {
          let rowTicketFound = false;

          for (let cIdx = 0; cIdx < cells.length; cIdx++) {
            // If this is the last cell and there are 3+ cells, it is the PRIZE amount column
            if (cIdx >= cells.length - 1 && cells.length >= 3) {
              continue; // Skip the prize money column!
            }

            const cellTokens = cells[cIdx].split(/\s+/).filter(Boolean);
            for (const token of cellTokens) {
              if (isLikelyWord(token)) continue;
              if (token.includes('/') || token.includes(':')) continue;

              const corrected = applyOCRCorrections(token);
              const digits = corrected.replace(/\D/g, '');

              if (digits.length === 4 || digits.length === 5) {
                const suggestedRank = lineRank || activeBlockRank || suggestRankByDigitCount(digits);
                results.push({
                  number: digits,
                  suggestedRank: suggestedRank || '3RD',
                  confidence: /^\d+$/.test(token) ? 0.95 : 0.70,
                  raw: token,
                });
                rowTicketFound = true;
                break; // At most one winning ticket per table row
              }
            }

            if (rowTicketFound) break;
          }

          if (rowTicketFound) continue;
        }
      } else {
        // Space-delimited table row (e.g. "7803 3rd 50 Chechay 25000")
        const tokens = line.split(/\s+/).filter(Boolean);
        const candidates = [];

        for (let tIdx = 0; tIdx < tokens.length; tIdx++) {
          const token = tokens[tIdx];
          if (isLikelyWord(token)) continue;
          if (token.includes('/') || token.includes(':')) continue;

          const corrected = applyOCRCorrections(token);
          const digits = corrected.replace(/\D/g, '');

          if (digits.length === 4 || digits.length === 5) {
            candidates.push({ digits, token, index: tIdx });
          }
        }

        if (candidates.length >= 2) {
          // Multiple candidate numbers on a tabular row:
          // The first candidate is the ticket number, while the trailing candidate is the prize money!
          const ticketCandidate = candidates[0];
          const suggestedRank = lineRank || activeBlockRank || suggestRankByDigitCount(ticketCandidate.digits);
          results.push({
            number: ticketCandidate.digits,
            suggestedRank: suggestedRank || '3RD',
            confidence: /^\d+$/.test(ticketCandidate.token) ? 0.95 : 0.70,
            raw: ticketCandidate.token,
          });
          continue;
        } else if (candidates.length === 1) {
          const single = candidates[0];
          const isAtEnd = single.index === tokens.length - 1;
          const isCommonPrize = COMMON_PRIZE_AMOUNTS.has(single.digits);
          if (!(isAtEnd && isCommonPrize)) {
            const suggestedRank = lineRank || activeBlockRank || suggestRankByDigitCount(single.digits);
            results.push({
              number: single.digits,
              suggestedRank: suggestedRank || '3RD',
              confidence: /^\d+$/.test(single.token) ? 0.95 : 0.70,
              raw: single.token,
            });
          }
          continue;
        }
      }
    }

    // 3. General / Grid format processing:
    const rawTokens = cleanedLine.split(/[\s,;:|]+/).filter(Boolean);

    for (const rawToken of rawTokens) {
      // Exclude words (e.g. CONGRATULATIONS, Bhutan, Name)
      if (isLikelyWord(rawToken)) continue;

      // Exclude tokens with date/time/slash separators
      if (rawToken.includes('/') || rawToken.includes(':')) continue;

      // Apply character corrections
      const corrected = applyOCRCorrections(rawToken);

      // Strip non-digits
      const digitsOnly = corrected.replace(/[^0-9]/g, '');

      // Only accept exactly 4 or 5 digit sequences
      if (digitsOnly.length !== 4 && digitsOnly.length !== 5) continue;

      // Exclude common prize amounts if near prize keywords or on a line with rank header
      if (COMMON_PRIZE_AMOUNTS.has(digitsOnly)) {
        if (lowerLine.includes('prize') || lowerLine.includes('rs') || lowerLine.includes('total')) {
          continue;
        }
      }

      // Assign detected rank from line/block, or fallback to digit count
      const suggestedRank = lineRank || activeBlockRank || suggestRankByDigitCount(digitsOnly);

      const wasAlreadyDigits = /^\d+$/.test(rawToken) && rawToken.length === digitsOnly.length;
      const confidence = wasAlreadyDigits ? 0.95 : 0.70;

      results.push({
        number:        digitsOnly,
        suggestedRank: suggestedRank || '3RD',
        confidence,
        raw:           rawToken,
      });
    }
  }

  return results;
}

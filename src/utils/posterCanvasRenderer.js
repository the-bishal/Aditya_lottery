/**
 * posterCanvasRenderer.js
 * Overlay-only renderer for the fully-printed Rajshree lottery templates.
 *
 * Background images (morning_result.jpg / evening_result.jpg) already contain
 * all static labels, prize amounts, branding, and festive banners.
 * This renderer ONLY draws the dynamic data fields on top:
 *   - Draw Number
 *   - Draw Date
 *   - 1st Prize Ticket Number
 *   - Consolation Last-5 Digits
 *   - 2nd Prize Numbers  (10 numbers)
 *   - 3rd Prize Numbers  (15 numbers)
 *   - 4th Prize Numbers  (15 numbers)
 *   - 5th Prize Numbers  (100 numbers, 10×10 grid)
 *   - Footer Date & Time
 *
 * Canvas native size: 753 × 1024 px (matches the uploaded template images).
 */

// ─── Day of Week Constants & Helpers ────────────────────────────────────────
export const DAY_KEYS = ['sun', 'mon', 'tues', 'wed', 'thur', 'fri', 'sat'];

/**
 * Sorts numbers in ascending numerical order while preserving string format and leading zeros.
 *
 * @param {string[]} arr
 * @returns {string[]}
 */
export function sortNumbersAscending(arr) {
  if (!Array.isArray(arr)) return [];
  return [...arr]
    .filter((n) => n != null && String(n).trim() !== '')
    .map(String)
    .sort((a, b) => {
      const cleanA = a.trim();
      const cleanB = b.trim();
      const numA = Number(cleanA.replace(/\D/g, ''));
      const numB = Number(cleanB.replace(/\D/g, ''));
      if (isNaN(numA) || isNaN(numB)) {
        return cleanA.localeCompare(cleanB);
      }
      return numA - numB;
    });
}

/**
 * Arranges 5th prize numbers into a 10×10 grid in ascending order:
 * - Each column (0 to 9) is sorted in ascending order from top to bottom.
 * - Each row (0 to 9) is sorted in ascending order from left to right.
 * Matches Indian lottery ticket standards and DEFAULT_POSTER_DATA row-major layout.
 *
 * @param {string[]} arr
 * @returns {string[]} length 100 array in row-major order (row * 10 + col)
 */
export function arrange5thPrizeGrid(arr) {
  if (!Array.isArray(arr)) return [];
  const clean = arr.filter((n) => n != null && String(n).trim() !== '').map(String);
  if (clean.length === 0) return [];

  const sorted = sortNumbersAscending(clean);
  const total = sorted.length;
  const cols = 10;
  const rows = Math.min(10, Math.ceil(total / cols) || 1);
  const grid = new Array(Math.max(total, 100)).fill('');

  for (let i = 0; i < total; i++) {
    const col = Math.floor(i / rows);
    const row = i % rows;
    if (col < cols) {
      grid[row * cols + col] = sorted[i];
    } else {
      grid[i] = sorted[i];
    }
  }

  return grid;
}

export const DAY_LABELS = {
  sun: 'Sunday',
  mon: 'Monday',
  tues: 'Tuesday',
  wed: 'Wednesday',
  thur: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
};

/**
 * Resolve a canonical day key ('sun'..'sat') from explicit day, date string, or subtitle.
 *
 * @param {string} [explicitDay]
 * @param {string} [dateText]
 * @param {string} [subtitle]
 * @returns {'sun'|'mon'|'tues'|'wed'|'thur'|'fri'|'sat'}
 */
export function resolveDayKey(explicitDay, dateText, subtitle) {
  const ALIASES = {
    sun: 'sun', sunday: 'sun',
    mon: 'mon', monday: 'mon',
    tue: 'tues', tues: 'tues', tuesday: 'tues',
    wed: 'wed', wednesday: 'wed',
    thu: 'thur', thur: 'thur', thurs: 'thur', thursday: 'thur',
    fri: 'fri', friday: 'fri',
    sat: 'sat', saturday: 'sat',
  };

  // 1. Explicit day override
  if (explicitDay) {
    const clean = String(explicitDay).toLowerCase().trim();
    if (ALIASES[clean]) return ALIASES[clean];
  }

  // 2. Parse from date string (DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, etc.)
  if (dateText) {
    const raw = String(dateText).trim().toLowerCase();
    for (const [alias, canonical] of Object.entries(ALIASES)) {
      if (raw.includes(alias)) return canonical;
    }

    const parts = raw.split(/[\/\-\.]/).map((p) => p.trim());
    if (parts.length === 3) {
      let dObj = null;
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else if (parts[2].length === 4) {
        // DD/MM/YYYY
        dObj = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      } else if (parts[2].length === 2) {
        // DD/MM/YY
        const yr = 2000 + parseInt(parts[2], 10);
        dObj = new Date(yr, parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      }
      if (dObj && !isNaN(dObj.getTime())) {
        return DAY_KEYS[dObj.getDay()];
      }
    }

    const fallbackDate = new Date(dateText);
    if (!isNaN(fallbackDate.getTime())) {
      return DAY_KEYS[fallbackDate.getDay()];
    }
  }

  // 3. Parse from subtitle (e.g. "DIAMOND SUNDAY WEEKLY LOTTERY")
  if (subtitle) {
    const sub = String(subtitle).toLowerCase();
    for (const [alias, canonical] of Object.entries(ALIASES)) {
      if (sub.includes(alias)) return canonical;
    }
  }

  // 4. Default to current day
  return DAY_KEYS[new Date().getDay()];
}

// ─── Image Cache & Template Loader ───────────────────────────────────────────
const bgCache = {};

/**
 * Returns the public URL path for a given session and day-of-week template.
 * Defaults to current day of the week if day is not provided.
 *
 * Pattern:
 *   Morning: /background/morning/{sun|mon|tues|wed|thur|fri|sat}_mor.jpeg
 *   Evening: /background/evening/{sun|mon|tues|wed|thur|fri|sat}_eve.jpeg
 */
export function getBackgroundSrc(session = 'morning', day) {
  const sessionKey = session === 'evening' ? 'evening' : 'morning';
  const suffix = sessionKey === 'evening' ? 'eve' : 'mor';
  const todayKey = DAY_KEYS[new Date().getDay()];
  const validDay = (day && DAY_KEYS.includes(day)) ? day : todayKey;
  return `/background/${sessionKey}/${validDay}_${suffix}.jpeg`;
}

/**
 * Preload and cache the background template for the given session and day.
 * Defaults to current day of the week if day is not provided.
 *
 * @param {'morning'|'evening'} session
 * @param {string} [day]
 * @returns {Promise<HTMLImageElement>}
 */
export function loadBackgroundTemplate(session = 'morning', day) {
  const sessionKey = session === 'evening' ? 'evening' : 'morning';
  const todayKey = DAY_KEYS[new Date().getDay()];
  const validDay = (day && DAY_KEYS.includes(day)) ? day : todayKey;
  const cacheKey = `${sessionKey}_${validDay}`;

  if (bgCache[cacheKey]) return Promise.resolve(bgCache[cacheKey]);

  const primarySrc = getBackgroundSrc(sessionKey, validDay);
  const fallbackSrc = sessionKey === 'evening'
    ? '/background/evening_result.jpg'
    : '/background/morning_result.jpg';

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      bgCache[cacheKey] = img;
      resolve(img);
    };
    img.onerror = () => {
      console.warn(`[PosterRenderer] Failed to load primary background: ${primarySrc}, trying fallback: ${fallbackSrc}`);
      const fallbackImg = new Image();
      fallbackImg.crossOrigin = 'anonymous';
      fallbackImg.onload = () => {
        bgCache[cacheKey] = fallbackImg;
        resolve(fallbackImg);
      };
      fallbackImg.onerror = () => {
        console.warn(`[PosterRenderer] Failed to load fallback background: ${fallbackSrc}`);
        resolve(null);
      };
      fallbackImg.src = fallbackSrc;
    };
    img.src = primarySrc;
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Draw a rounded rectangle path (polyfill for ctx.roundRect) */
function roundRectPath(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

/** Centred text with optional max-width shrink and optional stroke */
function drawCentred(ctx, text, cx, cy, font, color, maxWidth, strokeWidth) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (strokeWidth) {
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = color;
    if (maxWidth) ctx.strokeText(text, cx, cy, maxWidth);
    else ctx.strokeText(text, cx, cy);
  }
  if (maxWidth) {
    ctx.fillText(text, cx, cy, maxWidth);
  } else {
    ctx.fillText(text, cx, cy);
  }
  ctx.restore();
}

// ─── Layout Constants (calibrated to 753 × 1024 template) ────────────────────
// All coordinates are in native template pixels.

const W = 753;   // template width
const H = 1024;  // template height

/**
 * MORNING (2 PM) — Diamond Sunday Weekly Lottery
 *
 * Pixel-measured coordinates (753×1024 template):
 *   DRAW row (yellow band):  y=138–178  → centre y=158
 *   1st Prize white box:     y=191–239  → centre y=215
 */
const MORNING = {
  // Draw Number: in the yellow band box
  drawNumber: { cx: 405, cy: 159, font: '900 28px "Arial Black", Arial, sans-serif', color: '#D80027' },

  // Draw Date: centered in pill next to draw number
  drawDate: { cx: 524, cy: 162, font: '900 28px "Arial Black", Arial, sans-serif', color: '#FFFFFF' },

  // 1st Prize ticket: large white box, centered horizontally at cx=502, cy=216
  firstPrize: {
    cx: 475, cy: 220,
    font: ' 55px "Arial Black", Arial, sans-serif',
    color: '#D80027', maxW: 390,
  },

  // Consolation last-5 digits: strip after 'for Seller ₹500/-'
  consPrize: { cx: 450, cy: 266.5, font: '22px "Arial Black", Arial, sans-serif', color: '#000000'},

  // 2nd Prize: 2 rows of 5 numbers
  second: {
    cols: [329.5, 412, 495.5, 578, 662],
    rows: [307, 332.5],
    font: ' 22px "Arial Black", Arial, sans-serif', color: '#000000',
  },

  // 3rd Prize: 3 rows of 5 numbers
  third: {
    cols: [338, 418, 496, 574, 652],
    rows: [374, 399, 423.5],
    font: ' 25px "Arial Black", Arial, sans-serif', color: '#000000',
  },

  // 4th Prize: 3 rows of 5 numbers
  fourth: {
    cols: [340, 416.5, 494.5, 572.5, 650],
    rows: [464.5, 489.5, 514.5],
    font: ' 24.5px "Arial Black", Arial, sans-serif', color: '#000000',

  },

  // 5th Prize grid: 10 rows × 10 cols
  fifth: {
    cols: [40.5, 113.3, 187.1, 260.9, 334.7, 410.5, 485.3, 559.1, 632.9, 706.7],
    rows: [800, 818, 836, 854, 872, 890, 908, 926, 944, 962],
    font: '18px "Arial Black", Arial, sans-serif', color: '#000000',
  },

  // Footer bar: yellow band
  footer: {
    leftDate:  { cx: 82,  cy: 1001, font: ' 24px "Arial Black", Arial, sans-serif', color: '#D80027' },
    rightDate: { cx: 673, cy: 1001, font: ' 24px "Arial Black", Arial, sans-serif', color: '#D80027' },
  },
};

/**
 * EVENING (9 PM) — Gold Thursday Weekly Lottery
 * Very similar layout to MORNING; calibrated to match exact official sample.
 */
const EVENING = {
  drawNumber: { cx: 418, cy: 159, font: '900 28px "Arial Black", Arial, sans-serif', color: '#D80027' },

  drawDate: { cx: 524, cy: 159, font: '900 26px "Arial Black", Arial, sans-serif', color: '#FFFFFF' },

  firstPrize: {
    cx: 475, cy: 220,
    font: '900 48px "Arial Black", Arial, sans-serif',
    color: '#D80027', maxW: 390,
  },

  consPrize: { cx: 450, cy: 266.5, font: '900 22px "Arial Black", Arial, sans-serif', color: '#000000', strokeWidth: 0.2 },

  second: {
    cols: [329.5, 412, 495.5, 578, 662],
    rows: [307, 332.5],
    font: '22px "Arial Black", Arial, sans-serif', color: '#000000',
  },

  third: {
    cols: [338, 418, 496, 574, 652],
    rows: [374, 399, 423.5],
    font: ' 25px "Arial Black", Arial, sans-serif', color: '#000000',
  },

  fourth: {
    cols: [340, 416.5, 494.5, 572.5, 650],
    rows: [464.5, 489.5, 514.5],
    font: ' 24.5px "Arial Black", Arial, sans-serif', color: '#000000',
  },

  fifth: {
    cols: [40.5, 113.3, 186.1, 259.9, 331.7, 412.5, 485.3, 559.1, 632.9, 708.7],
    rows: [800, 818, 836, 854, 872, 890, 908, 926, 944, 962],
    font: ' 18px "Arial Black", Arial, sans-serif', color: '#000000',

  },

  footer: {
    leftDate:  { cx: 64,  cy: 1001, font: ' 20px "Arial Black", Arial, sans-serif', color: '#D80027' },
    rightDate: { cx: 673, cy: 1001, font: ' 24px "Arial Black", Arial, sans-serif', color: '#D80027' },
  },
};

// ─── Master Render Function ───────────────────────────────────────────────────

/**
 * Render the lottery result poster onto a canvas element.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Object} data  - posterData fields (see defaultPosterData.js)
 * @param {Object} [options]
 * @param {'morning'|'evening'} [options.session='morning']
 * @param {number} [options.scale=1]  - HiDPI scale multiplier
 */
export async function renderPosterOnCanvas(canvas, data, options = {}) {
  if (!canvas) return;

  const scale = options.scale || 1;
  canvas.width  = W * scale;
  canvas.height = H * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  if (scale !== 1) ctx.scale(scale, scale);

  // Wait for fonts
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try { await document.fonts.ready; } catch { /* continue */ }
  }

  // Determine session
  const isEvening =
    options.session === 'evening' ||
    (data.drawTime && data.drawTime.toLowerCase().includes('9')) ||
    (data.drawSubtitle && data.drawSubtitle.toLowerCase().includes('gold'));
  const sessionKey = isEvening ? 'evening' : 'morning';
  const L = isEvening ? EVENING : MORNING; // layout constants

  // Determine day of week
  const dayKey = resolveDayKey(options.day || data.day, data.drawDate, data.drawSubtitle);

  // ── 1. Draw the background template ────────────────────────────────────────
  try {
    const bgImg = await loadBackgroundTemplate(sessionKey, dayKey);
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#FFFEEB';
      ctx.fillRect(0, 0, W, H);
    }
  } catch {
    ctx.fillStyle = '#FFFEEB';
    ctx.fillRect(0, 0, W, H);
  }

  // ── 2. Draw Number ──────────────────────────────────────────────────────────
  const drawNum = String(data.drawNumber || (isEvening ? '2' : '1'));
  drawCentred(ctx, drawNum, L.drawNumber.cx, L.drawNumber.cy,
    L.drawNumber.font, L.drawNumber.color);

  // ── 3. Draw Date ────────────────────────────────────────────────────────────
  const dateText = String(data.drawDate || '');
  if (dateText) {
    const d = L.drawDate;
    if (d.pillColor) {
      ctx.save();
      ctx.fillStyle = d.pillColor;
      ctx.beginPath();
      roundRectPath(ctx, d.pillX, d.pillY, d.pillW, d.pillH, d.pillR);
      ctx.fill();
      ctx.restore();
    }
    drawCentred(ctx, dateText, d.cx, d.cy, d.font, d.color);
  }

  // ── 4. 1st Prize Ticket Number ──────────────────────────────────────────────
  const ticket = String(data.firstPrizeTicket || '').trim();
  if (ticket) {
    const fp = L.firstPrize;
    drawCentred(ctx, ticket, fp.cx, fp.cy, fp.font, fp.color, fp.maxW);
  }

  // ── 5. Consolation Last-5 Digits ────────────────────────────────────────────
  const consNum = String(data.consPrizeNumber || '').trim();
  if (consNum) {
    const cp = L.consPrize;
    drawCentred(ctx, consNum, cp.cx, cp.cy, cp.font, cp.color, undefined, cp.strokeWidth);
  }

  // ── 6. 2nd Prize Numbers (10 numbers, 2 rows × 5 cols) ─────────────────────
  const secNums = sortNumbersAscending(Array.isArray(data.secondPrizeNumbers) ? data.secondPrizeNumbers : []);
  {
    const s = L.second;
    ctx.save();
    ctx.font = s.font;
    ctx.fillStyle = s.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (s.strokeWidth) {
      ctx.lineWidth = s.strokeWidth;
      ctx.strokeStyle = s.color;
    }
    for (let c = 0; c < 5; c++) {
      const cx = s.cols[c];
      const n1 = secNums[c] || '';
      const n2 = secNums[c + 5] || '';
      if (s.strokeWidth) {
        if (n1) ctx.strokeText(n1, cx, s.rows[0]);
        if (n2) ctx.strokeText(n2, cx, s.rows[1]);
      }
      if (n1) ctx.fillText(n1, cx, s.rows[0]);
      if (n2) ctx.fillText(n2, cx, s.rows[1]);
    }
    ctx.restore();
  }

  // ── 7. 3rd Prize Numbers (15 numbers, 3 rows × 5 cols) ─────────────────────
  const thirdNums = sortNumbersAscending(Array.isArray(data.thirdPrizeNumbers) ? data.thirdPrizeNumbers : []);
  {
    const t = L.third;
    ctx.save();
    ctx.font = t.font;
    ctx.fillStyle = t.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (t.strokeWidth) {
      ctx.lineWidth = t.strokeWidth;
      ctx.strokeStyle = t.color;
    }
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        const cx = t.cols[c];
        const val = thirdNums[r * 5 + c] || '';
        if (val) {
          if (t.strokeWidth) ctx.strokeText(val, cx, t.rows[r]);
          ctx.fillText(val, cx, t.rows[r]);
        }
      }
    }
    ctx.restore();
  }

  // ── 8. 4th Prize Numbers (15 numbers, 3 rows × 5 cols) ─────────────────────
  const fourthNums = sortNumbersAscending(Array.isArray(data.fourthPrizeNumbers) ? data.fourthPrizeNumbers : []);
  {
    const f = L.fourth;
    ctx.save();
    ctx.font = f.font;
    ctx.fillStyle = f.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (f.strokeWidth) {
      ctx.lineWidth = f.strokeWidth;
      ctx.strokeStyle = f.color;
    }
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        const cx = f.cols[c];
        const val = fourthNums[r * 5 + c] || '';
        if (val) {
          if (f.strokeWidth) ctx.strokeText(val, cx, f.rows[r]);
          ctx.fillText(val, cx, f.rows[r]);
        }
      }
    }
    ctx.restore();
  }

  // ── 9. 5th Prize Numbers (100 numbers, 10 rows × 10 cols) ──────────────────
  const fifthNums = arrange5thPrizeGrid(Array.isArray(data.fifthPrizeNumbers) ? data.fifthPrizeNumbers : []);
  {
    const g = L.fifth;
    ctx.save();
    ctx.font = g.font;
    ctx.fillStyle = g.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (g.strokeWidth) {
      ctx.lineWidth = g.strokeWidth;
      ctx.strokeStyle = g.color;
    }
    for (let r = 0; r < 10; r++) {
      const cy = g.rows[r];
      for (let c = 0; c < 10; c++) {
        const cx = g.cols[c];
        const val = fifthNums[r * 10 + c] || '';
        if (val) {
          if (g.strokeWidth) ctx.strokeText(val, cx, cy);
          ctx.fillText(val, cx, cy);
        }
      }
    }
    ctx.restore();
  }

  // ── 10. Footer: Date (left), Time (centre), Date (right) ───────────────────
  const footDate = String(data.drawDate || data.footerLeftDate || '');
  const footTime = String(data.drawTime || data.footerTime || (isEvening ? '9 PM' : '2 PM'));

  if (footDate) {
    drawCentred(ctx, footDate, L.footer.leftDate.cx,  L.footer.leftDate.cy,  L.footer.leftDate.font,  L.footer.leftDate.color);
    drawCentred(ctx, footDate, L.footer.rightDate.cx, L.footer.rightDate.cy, L.footer.rightDate.font, L.footer.rightDate.color);
  }
  if (L.footer?.time) {
    drawCentred(ctx, footTime, L.footer.time.cx, L.footer.time.cy, L.footer.time.font, L.footer.time.color);
  }
}

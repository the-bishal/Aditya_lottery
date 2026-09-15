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
 *   Consolation bar:         y=280–292  → centre y=286
 *   2nd Prize white zone:    y=292–347  → rows at y=313, 334
 *   3rd Prize white zone:    y=356–440  → rows at y=376, 400, 424
 *   4th Prize white zone:    y=448–530  → rows at y=467, 490, 513
 *   5th Prize grid:          y=796–975  → rowH=18, startY=805
 *   Footer yellow band:      y=998–1012 → centre y=1003
 */
const MORNING = {
  // Draw Number — in the DRAW No. red area (yellow band, right of the DRAW label)
  drawNumber: { cx: 400, cy: 163, font: '900 27px "Poppins", Arial, sans-serif', color: '#D80027' },

  // Draw Date — green pill immediately right of the draw number
  drawDate: {
    cx: 530, cy: 163,
    font: '900 28px "Poppins", Arial, sans-serif', color: '#FFFFFF',
  },

  // 1st Prize ticket — large white box (y=191–239), centred
  firstPrize: {
    cx: 480, cy: 219,
    font: '900 40px "JetBrains Mono","Courier New",monospace',
    color: '#D80027', maxW: 400,
  },

  // Consolation last-5 digits — thin strip at y=280–292; number after the label
  consPrize: { cx: 455, cy: 265, font: '900 22px "JetBrains Mono",monospace', color: '#000000', strokeWidth: 0.8 },

  // 2nd Prize — white zone y=292–347 → 2 rows of 5 numbers
  second: {
    startX: 240, endX: 748,
    row1Y: 313, row2Y: 334,
    cols: 5,
    font: '900 19px "JetBrains Mono",monospace', color: '#000000',
    strokeWidth: 0.8,
  },

  // 3rd Prize — blue badge zone y=356–440 → 3 rows of 5 numbers
  third: {
    startX: 240, endX: 748,
    row1Y: 376, row2Y: 400, row3Y: 424,
    cols: 5,
    font: '900 18px "JetBrains Mono",monospace', color: '#000000',
    strokeWidth: 0.7,
  },

  // 4th Prize — brown badge zone y=448–530 → 3 rows of 5 numbers
  fourth: {
    startX: 240, endX: 748,
    row1Y: 467, row2Y: 490, row3Y: 513,
    cols: 5,
    font: '900 18px "JetBrains Mono",monospace', color: '#000000',
    strokeWidth: 0.7,
  },

  // 5th Prize grid — white area y=796–975, 10 rows × 10 cols
  fifth: {
    tableLeft: 4, tableRight: 749,
    rowStartY: 796, rowHeight: 18,
    rows: 10, cols: 10,
    font: '900 14px "JetBrains Mono",monospace', color: '#000000',
    strokeWidth: 0.6,
  },

  // Footer bar — yellow band y=998–1012
  footer: {
    leftDate:  { cx: 78,  cy: 1003, font: '900 25px "Poppins",Arial,sans-serif', color: '#D80027' },
    rightDate: { cx: 674, cy: 1003, font: '900 25px "Poppins",Arial,sans-serif', color: '#D80027' },
  },
};

/**
 * EVENING (9 PM) — Gold Thursday Weekly Lottery
 * Very similar layout to MORNING; minor vertical adjustments for different header height.
 */
const EVENING = {
  drawNumber: { cx: 400, cy: 163, font: '900 27px "Poppins", Arial, sans-serif', color: '#072166' },

  drawDate: {
    cx: 530, cy: 163,
    font: '900 24px "Poppins", Arial, sans-serif', color: '#FFFFFF',
  },

  firstPrize: {
    cx: 480, cy: 221,
    font: '900 40px "JetBrains Mono","Courier New",monospace',
    color: '#D80027', maxW: 400,
  },

  consPrize: { cx: 454, cy: 269, font: '900 22px "JetBrains Mono",monospace', color: '#000000', strokeWidth: 0.8 },

  second: {
    startX: 248, endX: 748,
    row1Y: 313, row2Y: 334,
    cols: 5,
    font: '900 19px "JetBrains Mono",monospace', color: '#000000',
    strokeWidth: 0.8,
  },

  third: {
    startX: 240, endX: 748,
    row1Y: 376, row2Y: 396, row3Y: 420,
    cols: 5,
    font: '900 18px "JetBrains Mono",monospace', color: '#000000',
    strokeWidth: 0.7,
  },

  fourth: {
    startX: 240, endX: 748,
    row1Y: 458, row2Y: 480, row3Y: 502,
    cols: 5,
    font: '900 18px "JetBrains Mono",monospace', color: '#000000',
    strokeWidth: 0.7,
  },

  fifth: {
    tableLeft: 4, tableRight: 749,
    rowStartY: 792, rowHeight: 18,
    rows: 10, cols: 10,
    font: '900 14px "JetBrains Mono",monospace', color: '#000000',
    strokeWidth: 0.6,
  },

  footer: {
    leftDate:  { cx: 60,  cy: 1003, font: '900 21px "Poppins",Arial,sans-serif', color: '#FFF' },
    rightDate: { cx: 666, cy: 1003, font: '900 22px "Poppins",Arial,sans-serif', color: '#FFF' },
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

  // ── 3. Draw Date (in green pill) ────────────────────────────────────────────
  const dateText = String(data.drawDate || '');
  if (dateText) {
    const d = L.drawDate;
    // Green pill background
    ctx.save();
    ctx.fillStyle = d.pillColor;
    ctx.beginPath();
    roundRectPath(ctx, d.pillX, d.pillY, d.pillW, d.pillH, d.pillR);
    ctx.fill();
    ctx.restore();
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
  const secNums = Array.isArray(data.secondPrizeNumbers) ? data.secondPrizeNumbers : [];
  {
    const s = L.second;
    const colW = (s.endX - s.startX) / s.cols;
    ctx.save();
    ctx.font = s.font;
    ctx.fillStyle = s.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (s.strokeWidth) {
      ctx.lineWidth = s.strokeWidth;
      ctx.strokeStyle = s.color;
    }
    for (let c = 0; c < s.cols; c++) {
      const cx = s.startX + c * colW + colW / 2;
      const n1 = secNums[c] || '';
      const n2 = secNums[c + 5] || '';
      if (s.strokeWidth) {
        if (n1) ctx.strokeText(n1, cx, s.row1Y);
        if (n2) ctx.strokeText(n2, cx, s.row2Y);
      }
      if (n1) ctx.fillText(n1, cx, s.row1Y);
      if (n2) ctx.fillText(n2, cx, s.row2Y);
    }
    ctx.restore();
  }

  // ── 7. 3rd Prize Numbers (15 numbers, 3 rows × 5 cols) ─────────────────────
  const thirdNums = Array.isArray(data.thirdPrizeNumbers) ? data.thirdPrizeNumbers : [];
  {
    const t = L.third;
    const colW = (t.endX - t.startX) / t.cols;
    const rowYs = [t.row1Y, t.row2Y, t.row3Y];
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
      for (let c = 0; c < t.cols; c++) {
        const cx = t.startX + c * colW + colW / 2;
        const val = thirdNums[r * 5 + c] || '';
        if (val) {
          if (t.strokeWidth) ctx.strokeText(val, cx, rowYs[r]);
          ctx.fillText(val, cx, rowYs[r]);
        }
      }
    }
    ctx.restore();
  }

  // ── 8. 4th Prize Numbers (15 numbers, 3 rows × 5 cols) ─────────────────────
  const fourthNums = Array.isArray(data.fourthPrizeNumbers) ? data.fourthPrizeNumbers : [];
  {
    const f = L.fourth;
    const colW = (f.endX - f.startX) / f.cols;
    const rowYs = [f.row1Y, f.row2Y, f.row3Y];
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
      for (let c = 0; c < f.cols; c++) {
        const cx = f.startX + c * colW + colW / 2;
        const val = fourthNums[r * 5 + c] || '';
        if (val) {
          if (f.strokeWidth) ctx.strokeText(val, cx, rowYs[r]);
          ctx.fillText(val, cx, rowYs[r]);
        }
      }
    }
    ctx.restore();
  }

  // ── 9. 5th Prize Numbers (100 numbers, 10 rows × 10 cols) ──────────────────
  const fifthNums = Array.isArray(data.fifthPrizeNumbers) ? data.fifthPrizeNumbers : [];
  {
    const g = L.fifth;
    const colWidth = (g.tableRight - g.tableLeft) / g.cols;
    ctx.save();
    ctx.font = g.font;
    ctx.fillStyle = g.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (g.strokeWidth) {
      ctx.lineWidth = g.strokeWidth;
      ctx.strokeStyle = g.color;
    }
    for (let r = 0; r < g.rows; r++) {
      const cy = g.rowStartY + r * g.rowHeight + g.rowHeight / 2;
      for (let c = 0; c < g.cols; c++) {
        const cx = g.tableLeft + c * colWidth + colWidth / 2;
        const val = fifthNums[r * g.cols + c] || '';
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
  drawCentred(ctx, footTime, L.footer.time.cx, L.footer.time.cy, L.footer.time.font, L.footer.time.color);
}

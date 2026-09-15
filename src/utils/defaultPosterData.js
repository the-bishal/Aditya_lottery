/**
 * defaultPosterData.js
 * Only the DYNAMIC fields that are overlaid on top of the printed template.
 * All static labels (prize amounts, branding, etc.) are baked into the background images.
 * Numbers are preserved as strings to protect leading zeros.
 */

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const todayDateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

export const DEFAULT_POSTER_DATA = {
  // Header
  drawNumber: '1',
  drawDate:   todayDateStr,

  // Session metadata (controls which background template is used)
  drawTime:     '2 PM',
  drawSubtitle: 'DIAMOND SUNDAY WEEKLY LOTTERY', // used only to detect session

  // 1st Prize winning ticket (e.g. "43C 35972")
  firstPrizeTicket: '43C 35972',

  // Consolation last-5 digits (after "Cons.Prize Amount for Winner ₹1000/- for Seller ₹500/-")
  consPrizeNumber: '32432',

  // 2nd Prize — 10 five-digit numbers
  secondPrizeNumbers: [
    '14270', '49463', '60718', '67452', '77242',
    '84634', '87864', '92901', '96006', '98533',
  ],

  // 3rd Prize — 15 four-digit numbers
  thirdPrizeNumbers: [
    '0254', '1632', '3018', '3397', '3657',
    '4633', '5521', '5765', '5955', '6660',
    '7831', '8087', '8541', '9448', '9673',
  ],

  // 4th Prize — 15 four-digit numbers
  fourthPrizeNumbers: [
    '0359', '1594', '1791', '2116', '2471',
    '2866', '3337', '3703', '4356', '4378',
    '4844', '5615', '6101', '7961', '8109',
  ],

  // 5th Prize — 100 four-digit numbers (10 × 10 grid)
  fifthPrizeNumbers: [
    '0044', '1049', '2021', '3099', '4131', '5073', '6009', '7415', '8216', '9058',
    '0061', '1127', '2121', '3216', '4172', '5087', '6153', '7515', '8312', '9316',
    '0125', '1243', '2239', '3330', '4308', '5402', '6192', '7590', '8689', '9324',
    '0203', '1476', '2248', '3457', '4370', '5437', '6523', '7598', '8726', '9360',
    '0565', '1645', '2362', '3470', '4463', '5502', '6579', '7665', '8799', '9476',
    '0591', '1697', '2483', '3513', '4791', '5560', '6600', '7726', '8862', '9691',
    '0627', '1722', '2608', '3563', '4609', '5730', '6673', '7759', '8874', '9694',
    '0804', '1744', '2657', '3773', '4916', '5810', '6690', '7813', '8929', '9733',
    '0812', '1946', '2855', '3777', '4958', '5823', '6830', '7908', '8936', '9953',
    '0847', '1997', '2916', '3837', '4997', '5966', '6920', '7974', '8966', '9967',
  ],
};

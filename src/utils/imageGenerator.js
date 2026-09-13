/**
 * imageGenerator.js
 * Uses html2canvas to capture a DOM element and produce a downloadable PNG.
 */

import html2canvas from 'html2canvas';

/**
 * Capture a DOM element as a PNG image.
 *
 * @param {HTMLElement} element  - the element to capture
 * @param {object}      options  - optional html2canvas options
 * @returns {Promise<string>}    - blob URL of the PNG
 */
export async function captureElement(element, options = {}) {
  const canvas = await html2canvas(element, {
    backgroundColor: '#0D0D1A',
    scale: 2,            // 2× for crisp high-DPI output
    useCORS: true,
    allowTaint: false,
    logging: false,
    ...options,
  });

  return canvas.toDataURL('image/png');
}

/**
 * Capture and immediately trigger a download.
 *
 * @param {HTMLElement} element
 * @param {string}      filename
 * @returns {Promise<string>} - the data URL
 */
export async function downloadElementAsImage(element, filename = 'result.png') {
  const dataURL = await captureElement(element);

  const link = document.createElement('a');
  link.href     = dataURL;
  link.download = filename;
  link.click();

  return dataURL;
}

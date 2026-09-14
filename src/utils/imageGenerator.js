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
  // Ensure all web fonts (JetBrains Mono) are completely loaded before capturing
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const { onclone: userOnClone, ...restOptions } = options;

  const canvas = await html2canvas(element, {
    backgroundColor: '#0D0D1A',
    scale: 2,            // 2× for crisp high-DPI output
    useCORS: true,
    allowTaint: false,
    logging: false,
    onclone: (clonedDoc, clonedElement) => {
      // html2canvas flexbox implementation does not handle align-items: center properly.
      // Transforming badge elements to inline-block with lineHeight equal to height in the clone
      // forces html2canvas's native line-box renderer to position text dead-center vertically.
      const badges = clonedElement.querySelectorAll('[data-prize-badge="true"]');
      badges.forEach((badge) => {
        const is1Cr = badge.getAttribute('data-rank') === '1CR';
        const targetHeight = is1Cr ? 36 : 28;
        // With 1.5px border on top and bottom (total 3px), content height is targetHeight - 3
        const contentLineHeight = `${targetHeight - 3}px`;

        badge.style.display = 'inline-block';
        badge.style.boxSizing = 'border-box';
        badge.style.height = `${targetHeight}px`;
        badge.style.lineHeight = contentLineHeight;
        badge.style.paddingTop = '0px';
        badge.style.paddingBottom = '0px';
        badge.style.marginTop = '0px';
        badge.style.marginBottom = '0px';
        badge.style.textAlign = 'center';
        badge.style.verticalAlign = 'middle';

        const spans = badge.querySelectorAll('span');
        spans.forEach((span) => {
          span.style.display = 'inline-block';
          span.style.lineHeight = contentLineHeight;
          span.style.marginTop = '0px';
          span.style.verticalAlign = 'middle';
        });
      });

      if (userOnClone) {
        userOnClone(clonedDoc, clonedElement);
      }
    },
    ...restOptions,
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

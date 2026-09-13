/**
 * ocrScanner.js
 * Wraps Tesseract.js for in-browser OCR.
 * Processes images of lottery tickets and extracts numeric data.
 */

import { createWorker } from 'tesseract.js';

let cachedWorker = null;
let workerReady  = false;

/**
 * Initialize (or reuse) a Tesseract worker.
 * Caches the worker instance for performance on repeated scans.
 */
async function getWorker() {
  if (cachedWorker && workerReady) return cachedWorker;

  cachedWorker = await createWorker('eng', 1, {
    logger: () => {}, // suppress internal logs; progress is passed via callback
  });
  workerReady = true;
  return cachedWorker;
}

/**
 * Run OCR on an image (File | Blob | string URL).
 *
 * @param {File|Blob|string} imageSource
 * @param {(progress: number) => void} onProgress - called with 0-100
 * @returns {Promise<string>} - raw OCR text
 */
export async function runOCR(imageSource, onProgress) {
  onProgress?.(5);

  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        const pct = Math.round(10 + m.progress * 85);
        onProgress?.(pct);
      }
    },
  });

  try {
    onProgress?.(10);
    const { data } = await worker.recognize(imageSource);
    onProgress?.(98);
    return data.text;
  } finally {
    await worker.terminate();
    onProgress?.(100);
  }
}

/**
 * Terminate the cached worker (call on component unmount).
 */
export async function terminateWorker() {
  if (cachedWorker) {
    await cachedWorker.terminate();
    cachedWorker = null;
    workerReady  = false;
  }
}

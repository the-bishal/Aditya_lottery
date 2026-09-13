import { create } from 'zustand';

/**
 * useLotteryStore — Central Zustand store for the entire admin panel.
 *
 * Sections:
 *  - excluded   : parsed set of excluded numbers (Step 1)
 *  - numbers    : OCR-parsed list of numbers with rank assignments (Step 2)
 *  - result     : base64 / blob URL of the generated result image (Step 3)
 *  - hardcopy   : numbers extracted from hardcopy image
 *  - middle     : computed middle-numbers from a range
 *  - ocr        : OCR scanning progress state
 */
const useLotteryStore = create((set, get) => ({
  // ── Step 1: Exclusion ─────────────────────────────────────────────────────
  excludedRangeText: '',          // raw textarea string
  excludedSet: new Set(),         // computed Set of excluded numbers

  setExcludedRangeText: (text) => set({ excludedRangeText: text }),

  applyExclusions: (parsedSet) => set({ excludedSet: parsedSet }),

  // ── Step 2: Numbers (OCR + rank assignment) ───────────────────────────────
  parsedNumbers: [],             // [{ id, number, rank }]
  uploadedImageURL: null,        // object URL of uploaded image

  setUploadedImageURL: (url) => set({ uploadedImageURL: url }),

  setParsedNumbers: (list) => set({ parsedNumbers: list }),

  updateNumberRank: (id, rank) =>
    set((state) => ({
      parsedNumbers: state.parsedNumbers.map((n) =>
        n.id === id ? { ...n, rank } : n
      ),
    })),

  removeNumber: (id) =>
    set((state) => ({
      parsedNumbers: state.parsedNumbers.filter((n) => n.id !== id),
    })),

  addNumber: (number) =>
    set((state) => ({
      parsedNumbers: [
        ...state.parsedNumbers,
        { id: Date.now(), number: number.toString(), rank: '' },
      ],
    })),

  clearNumbers: () => set({ parsedNumbers: [], uploadedImageURL: null }),

  // ── OCR Progress ──────────────────────────────────────────────────────────
  ocrProgress: 0,                // 0-100
  ocrStatus: 'idle',             // 'idle' | 'scanning' | 'done' | 'error'

  setOcrProgress: (progress) => set({ ocrProgress: progress }),
  setOcrStatus: (status) => set({ ocrStatus: status }),

  // ── Step 3: Result ───────────────────────────────────────────────────────
  resultImageURL: null,
  resultTitle: 'Lottery Result',
  resultDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD for <input type="date">

  setResultImageURL: (url) => set({ resultImageURL: url }),
  setResultTitle: (title) => set({ resultTitle: title }),
  setResultDate: (date) => set({ resultDate: date }),

  // ── Hardcopy Module ───────────────────────────────────────────────────────
  hardcopyNumbers: [],
  hardcopyImageURL: null,
  hardcopyOcrProgress: 0,
  hardcopyOcrStatus: 'idle',

  setHardcopyNumbers: (list) => set({ hardcopyNumbers: list }),
  setHardcopyImageURL: (url) => set({ hardcopyImageURL: url }),
  setHardcopyOcrProgress: (p) => set({ hardcopyOcrProgress: p }),
  setHardcopyOcrStatus: (s) => set({ hardcopyOcrStatus: s }),

  // ── Middle Numbers Module ─────────────────────────────────────────────────
  middleRangeStart: '',
  middleRangeEnd: '',
  middleNumbers: [],

  setMiddleRangeStart: (v) => set({ middleRangeStart: v }),
  setMiddleRangeEnd: (v) => set({ middleRangeEnd: v }),
  setMiddleNumbers: (list) => set({ middleNumbers: list }),

  // ── Global Reset ─────────────────────────────────────────────────────────
  resetAll: () =>
    set({
      excludedRangeText: '',
      excludedSet: new Set(),
      parsedNumbers: [],
      uploadedImageURL: null,
      ocrProgress: 0,
      ocrStatus: 'idle',
      resultImageURL: null,
      hardcopyNumbers: [],
      hardcopyImageURL: null,
      hardcopyOcrProgress: 0,
      hardcopyOcrStatus: 'idle',
    }),
}));

export default useLotteryStore;

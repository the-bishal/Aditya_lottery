import { create } from 'zustand';
import { buildExclusionCodeSet } from '../utils/exclusionCodes';
import { ALL_RANKS } from '../utils/placementEngine';

/**
 * useLotteryStore — Central Zustand store for the entire admin panel.
 *
 * Sections:
 *  - exclusion        : 2-digit code-based exclusion set (Step 1)
 *  - ocr              : OCR scanning progress state
 *  - ocrEntries       : Editable OCR entry list (Step 2 source of truth)
 *  - rankArrays       : Placed winners per rank (Step 2 destination)
 *  - generationStatus : 'idle' | 'generating' | 'success' | 'error'
 *  - saveStatus       : 'idle' | 'saving' | 'saved' | 'error'
 *  - saveError        : string description if server save fails
 *  - autoFillLogs     : array of operational console log messages
 *  - result           : base64 / blob URL of the generated result image (Step 3)
 *  - hardcopy         : numbers extracted from hardcopy image
 *  - middle           : computed middle-numbers from a range
 *
 * Exclusion logic:
 *   The user pastes previous prize blocks such as "25  10100 - 10199".
 *   For each 5-digit range the exclusion code is digits[1]+digits[2] of the start number.
 *   For 4-digit numbers the exclusion code is digits[0]+digits[1].
 *   These codes are stored as a Set<string> in `excludedCodeSet`.
 *   Exclusions apply ONLY to auto-generated fill numbers, NEVER to OCR / manual winners.
 */

function emptyRankArrays() {
  return ALL_RANKS.reduce((acc, r) => { acc[r] = []; return acc; }, {});
}

function createInitialSessionState(session = 'morning') {
  return {
    excludedRangeText: '',
    excludedCodeSet:   new Set(),
    ocrProgress:       0,
    ocrStatus:         'idle',
    ocrEntries:        [],
    rankArrays:        emptyRankArrays(),
    generationStatus:  'idle',
    placementStatus:   'idle',
    saveStatus:        'idle',
    saveError:         '',
    autoFillLogs:      [],
    uploadedImageURLs: [],
    resultImageURL:    null,
    resultTitle:       session === 'evening' ? 'Evening Lottery Result' : 'Morning Lottery Result',
    resultDate:        new Date().toISOString().split('T')[0],
    drawNumber:        session === 'evening' ? '2' : '1',
  };
}

const useLotteryStore = create((set, _get) => ({
  // ── Session Slot Support (Morning / Evening) ───────────────────────────────
  activeSession: 'morning', // 'morning' | 'evening'
  sessionData: {
    morning: createInitialSessionState('morning'),
    evening: createInitialSessionState('evening'),
  },

  switchSession: (session) => {
    const validSession = session === 'evening' ? 'evening' : 'morning';
    const state = _get();
    if (state.activeSession === validSession) return;

    const prevSession = state.activeSession;
    const currentSnapshot = {
      excludedRangeText: state.excludedRangeText,
      excludedCodeSet:   state.excludedCodeSet,
      ocrProgress:       state.ocrProgress,
      ocrStatus:         state.ocrStatus,
      ocrEntries:        state.ocrEntries,
      rankArrays:        state.rankArrays,
      generationStatus:  state.generationStatus,
      placementStatus:   state.placementStatus,
      saveStatus:        state.saveStatus,
      saveError:         state.saveError,
      autoFillLogs:      state.autoFillLogs,
      uploadedImageURLs: state.uploadedImageURLs,
      resultImageURL:    state.resultImageURL,
      resultTitle:       state.resultTitle,
      resultDate:        state.resultDate,
      drawNumber:        state.drawNumber,
    };

    const nextState = state.sessionData[validSession] || createInitialSessionState(validSession);

    set({
      activeSession: validSession,
      sessionData: {
        ...state.sessionData,
        [prevSession]: currentSnapshot,
      },
      ...nextState,
    });
  },

  // ── Step 1: Exclusion (code-based) ───────────────────────────────────────────
  excludedRangeText: '',        // raw textarea — pasted prize blocks
  excludedCodeSet:   new Set(), // Set<string> of 2-digit codes, e.g. {"01","62","47"}

  setExcludedRangeText: (text) => set({ excludedRangeText: text }),

  /**
   * Parse the current textarea text and store the resulting code set.
   * Called by StepExclude after the user clicks "Extract Codes".
   */
  applyExclusionCodes: (text) => {
    const codeSet = buildExclusionCodeSet(text);
    set({ excludedCodeSet: codeSet });
  },

  // ── OCR Progress ──────────────────────────────────────────────────────────────
  ocrProgress: 0,       // 0-100
  ocrStatus: 'idle',    // 'idle' | 'scanning' | 'done' | 'error'

  setOcrProgress: (progress) => set({ ocrProgress: progress }),
  setOcrStatus:   (status)   => set({ ocrStatus: status }),

  // ── Step 2: OCR Entries (editable list — single source of truth) ──────────────
  //
  // Each entry shape:
  //   {
  //     id:         string | number   (unique key)
  //     number:     string            (ticket number, leading zeros preserved)
  //     rank:       string            ('1CR' | '2ND' | '3RD' | '4TH' | '5TH' | '')
  //     confidence: number            (0–1; 1.0 for manual entries)
  //     source:     'ocr' | 'manual'
  //     edited:     boolean           (true after any user change)
  //     placed:     boolean           (true after successful placement)
  //   }
  ocrEntries: [],

  setOcrEntries: (list) => set({ ocrEntries: list }),

  /**
   * Append new OCR entries from one image scan without resetting existing ones.
   * Used when scanning multiple images sequentially.
   */
  appendOcrEntries: (newEntries) =>
    set((state) => ({ ocrEntries: [...state.ocrEntries, ...newEntries] })),

  updateOcrEntry: (id, patch) =>
    set((state) => ({
      ocrEntries: state.ocrEntries.map((e) =>
        e.id === id ? { ...e, ...patch, edited: true } : e
      ),
    })),

  removeOcrEntry: (id) =>
    set((state) => ({
      ocrEntries: state.ocrEntries.filter((e) => e.id !== id),
    })),

  clearOcrEntries: () => set({ ocrEntries: [] }),

  /**
   * Add a number manually to the OCR entry list.
   * Manual entries always have confidence 1.0 and source 'manual'.
   */
  addManualEntry: (number) =>
    set((state) => ({
      ocrEntries: [
        ...state.ocrEntries,
        {
          id:         `manual-${Date.now()}-${Math.random()}`,
          number:     number.toString().trim(),
          rank:       '',
          confidence: 1.0,
          source:     'manual',
          edited:     false,
          placed:     false,
        },
      ],
    })),

  // ── Step 2: Rank Arrays (placed winners destination) ─────────────────────────
  //
  // Each key maps to an array of placed number strings.
  // Counters and Step 3 both read directly from this — never from OCR counts.
  rankArrays: emptyRankArrays(),

  setRankArrays: (rankArrays) => set({ rankArrays }),

  setRankArray: (rank, arr) =>
    set((state) => ({
      rankArrays: { ...state.rankArrays, [rank]: arr },
    })),

  resetRankArrays: () => set({ rankArrays: emptyRankArrays() }),

  // ── Workflow Operation Statuses (Decoupled Generation vs Save) ────────────────
  generationStatus: 'idle', // 'idle' | 'generating' | 'success' | 'error'
  placementStatus:  'idle', // 'idle' | 'success'
  saveStatus:        'idle', // 'idle' | 'saving' | 'saved' | 'error'
  saveError:         '',
  autoFillLogs:      [],     // Console log lines: ['Auto-generated 1st Prize', 'Fill done! ...', 'Placed 141 winners']

  setGenerationStatus: (s) => set({ generationStatus: s }),
  setPlacementStatus:  (s) => set({ placementStatus: s }),
  setSaveStatus:        (s) => set({ saveStatus: s }),
  setSaveError:         (e) => set({ saveError: e }),
  setAutoFillLogs:      (logs) => set({ autoFillLogs: logs }),
  appendAutoFillLog:    (line) =>
    set((state) => ({ autoFillLogs: [...state.autoFillLogs, line] })),
  clearAutoFillLogs:    () => set({ autoFillLogs: [] }),

  // ── Step 2: Uploaded image URLs (multi-image preview) ────────────────────────
  uploadedImageURLs: [],

  addUploadedImageURL: (url) =>
    set((state) => ({ uploadedImageURLs: [...state.uploadedImageURLs, url] })),

  clearUploadedImageURLs: () => set({ uploadedImageURLs: [] }),

  // ── Step 3: Result ────────────────────────────────────────────────────────────
  resultImageURL: null,
  resultTitle:    'Lottery Result',
  resultDate:     new Date().toISOString().split('T')[0], // YYYY-MM-DD
  drawNumber:     '1',

  setResultImageURL: (url)   => set({ resultImageURL: url }),
  setResultTitle:    (title) => set({ resultTitle: title }),
  setResultDate:     (date)  => set({ resultDate: date }),
  setDrawNumber:     (num)   => set({ drawNumber: num }),

  // ── Hardcopy Module ───────────────────────────────────────────────────────────
  hardcopyNumbers:     [],
  hardcopyImageURL:    null,
  hardcopyOcrProgress: 0,
  hardcopyOcrStatus:   'idle',

  setHardcopyNumbers:     (list) => set({ hardcopyNumbers: list }),
  setHardcopyImageURL:    (url)  => set({ hardcopyImageURL: url }),
  setHardcopyOcrProgress: (p)    => set({ hardcopyOcrProgress: p }),
  setHardcopyOcrStatus:   (s)    => set({ hardcopyOcrStatus: s }),

  // ── Middle Numbers Module ─────────────────────────────────────────────────────
  middleSetCount:           '5',
  middleGeneratedSets:      [],
  middleVerificationStatus: 'idle', // 'idle' | 'verified' | 'failed'
  middleVerificationErrors: [],
  middleIsGenerating:       false,

  setMiddleSetCount:           (v)      => set({ middleSetCount: v }),
  setMiddleGeneratedSets:      (s)      => set({ middleGeneratedSets: s }),
  setMiddleVerificationStatus: (status) => set({ middleVerificationStatus: status }),
  setMiddleVerificationErrors: (errs)   => set({ middleVerificationErrors: errs }),
  setMiddleIsGenerating:       (g)      => set({ middleIsGenerating: g }),
  resetMiddleNumbers: () =>
    set({
      middleGeneratedSets:      [],
      middleVerificationStatus: 'idle',
      middleVerificationErrors: [],
      middleIsGenerating:       false,
    }),

  // Backward compatibility legacy fields
  middleRangeStart: '',
  middleRangeEnd:   '',
  middleNumbers:    [],
  setMiddleRangeStart: (v)    => set({ middleRangeStart: v }),
  setMiddleRangeEnd:   (v)    => set({ middleRangeEnd: v }),
  setMiddleNumbers:    (list) => set({ middleNumbers: list }),

  // ── Global Reset ──────────────────────────────────────────────────────────────
  resetAll: () =>
    set({
      excludedRangeText:        '',
      excludedCodeSet:          new Set(),
      ocrEntries:               [],
      rankArrays:               emptyRankArrays(),
      uploadedImageURLs:        [],
      ocrProgress:              0,
      ocrStatus:                'idle',
      generationStatus:         'idle',
      placementStatus:          'idle',
      saveStatus:               'idle',
      saveError:                '',
      autoFillLogs:             [],
      resultImageURL:           null,
      hardcopyNumbers:          [],
      hardcopyImageURL:         null,
      hardcopyOcrProgress:      0,
      hardcopyOcrStatus:        'idle',
      middleGeneratedSets:      [],
      middleVerificationStatus: 'idle',
      middleVerificationErrors: [],
      middleIsGenerating:       false,
    }),
}));

export default useLotteryStore;

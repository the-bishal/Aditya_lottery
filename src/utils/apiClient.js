/**
 * apiClient.js
 *
 * Safe HTTP client for Result Generation and lottery persistence.
 *
 * Key safety invariants:
 *  1. NEVER blindly call response.json() without checking response.ok and Content-Type.
 *  2. If the server returns HTML (e.g. 404, 500, 502, 503, or SPA index.html fallback),
 *     extract a descriptive, human-readable error without throwing:
 *     "Unexpected token '<', '<!DOCTYPE '... is not valid JSON".
 *  3. Include temporary detailed logging for network debugging:
 *     - API REQUEST: { url, method, body }
 *     - API RESPONSE: { status, contentType }
 *     - API RAW RESPONSE: raw response text
 *  4. Provide local persistence fallback (localStorage) so user data is never lost
 *     even when backend server is down, spinning up, or offline.
 */

const DEFAULT_API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '';

/**
 * Clean up HTML or long text into a concise, readable error message.
 * Strips HTML tags and limits length.
 */
function cleanErrorMessage(rawText, status) {
  if (!rawText || typeof rawText !== 'string') {
    return `HTTP ${status}`;
  }

  // If text starts with HTML tag, identify common scenarios
  const trimmed = rawText.trim();
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('<head') || trimmed.startsWith('<body')) {
    if (status === 404) {
      return `Server returned an invalid response (HTTP 404 Not Found). The API endpoint does not exist on this host.`;
    }
    if (status === 502 || status === 503 || status === 504) {
      return `Server is temporarily unavailable or starting up (HTTP ${status}). Please wait a moment and retry.`;
    }
    if (status === 500) {
      return `Server encountered an internal error (HTTP 500).`;
    }
    // Static hosting SPA rewrite returning index.html for unknown /api/ route
    return `Server returned an HTML page (HTTP ${status}) instead of JSON. Ensure the backend API server is online and configured.`;
  }

  // Strip XML/HTML tags if any
  const stripped = trimmed.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
  return stripped.slice(0, 200) || `HTTP ${status}`;
}

/**
 * Safe fetch wrapper that validates HTTP status and content-type before parsing JSON.
 *
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<any>}
 */
export async function safeFetch(url, options = {}) {
  const method = options.method || 'GET';
  let bodySummary = options.body;
  if (typeof bodySummary === 'string' && bodySummary.length > 250) {
    bodySummary = `${bodySummary.slice(0, 250)}... [truncated]`;
  }

  // Detailed debug logging
  console.log('[API REQUEST]:', {
    url,
    method,
    headers: options.headers,
    body: bodySummary,
  });

  let response;
  try {
    response = await fetch(url, options);
  } catch (networkError) {
    console.error('[API NETWORK ERROR]:', networkError);
    throw new Error(
      `Unable to connect to server (${networkError.message || 'Network error'}). Please check your connection or backend server.`
    );
  }

  const contentType = response.headers.get('content-type') || '';

  console.log('[API RESPONSE]:', {
    url,
    status: response.status,
    statusText: response.statusText,
    contentType,
  });

  // Handle non-2xx responses
  if (!response.ok) {
    const rawText = await response.text();
    console.warn('[API RAW RESPONSE (ERROR)]:', rawText.slice(0, 500));
    const message = cleanErrorMessage(rawText, response.status);
    throw new Error(`API request failed: ${message}`);
  }

  // Handle non-JSON content-type (e.g. text/html from fallback rewrites)
  if (!contentType.includes('application/json')) {
    const rawText = await response.text();
    console.warn('[API RAW RESPONSE (NON-JSON)]:', rawText.slice(0, 500));
    const message = cleanErrorMessage(rawText, response.status);
    throw new Error(`Invalid response format: Expected JSON but received ${contentType || 'text/html'}. ${message}`);
  }

  try {
    const data = await response.json();
    console.log('[API PARSED DATA]:', data);
    return data;
  } catch (parseError) {
    console.error('[API JSON PARSE ERROR]:', parseError);
    throw new Error(`Failed to parse server response as JSON: ${parseError.message}`);
  }
}

/**
 * Persist generated lottery result.
 * Tries server endpoint first (if available); always backs up to local storage
 * so data is guaranteed safe even if network/backend fails.
 *
 * @param {object} payload - { drawDate, drawNumber, resultTitle, rankArrays, totalWinners }
 * @returns {Promise<{ success: boolean, message: string, remoteSaved: boolean, localSaved: boolean, data?: any }>}
 */
export async function persistResultData(payload) {
  // 1. Local backup guarantee
  let localSaved = false;
  try {
    const localKey = `lottery_result_${payload.drawDate || 'latest'}_${payload.drawNumber || '1'}`;
    const serialized = JSON.stringify({ ...payload, savedAt: new Date().toISOString() });
    localStorage.setItem(localKey, serialized);
    localStorage.setItem('lottery_result_latest', serialized);
    localSaved = true;
  } catch (storageErr) {
    console.warn('[LOCAL STORAGE BACKUP WARNING]:', storageErr);
  }

  // 2. Server save attempt
  // In offline/client-only mode (no VITE_API_BASE_URL configured), complete cleanly via localStorage
  if (!DEFAULT_API_BASE) {
    console.info('[PERSISTENCE]: No remote API base URL configured (VITE_API_BASE_URL). Saved to local storage.');
    return {
      success: true,
      message: '✓ Saved to local storage (Offline Mode)',
      remoteSaved: false,
      localSaved,
    };
  }

  const endpoint = `${DEFAULT_API_BASE}/api/results`;

  try {
    const result = await safeFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: result.message || '✓ Result saved successfully to server',
      remoteSaved: true,
      localSaved,
      data: result,
    };
  } catch (apiError) {
    console.error('[PERSISTENCE API ERROR]:', apiError.message);
    throw apiError;
  }
}

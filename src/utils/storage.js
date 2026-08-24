/**
 * Storage utility for SkinScan AI:
 * Manages user-scoped local browser storage & server sync for skin scan history.
 */

import { getCurrentUser, saveUserScanRemote } from './auth';

const SETTINGS_KEY = 'skinscan_ai_settings_v1';

function getStorageKey() {
  const user = getCurrentUser();
  if (user && user.id) {
    return `skinscan_ai_history_usr_${user.id}`;
  }
  return 'skinscan_ai_history_guest';
}

/**
 * Gets saved scan history from user-scoped localStorage
 * @returns {Array<Object>} list of past scan records
 */
export function getScanHistory() {
  try {
    const key = getStorageKey();
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read scan history from storage:', err);
    return [];
  }
}

/**
 * Sets scan history array directly
 */
export function setScanHistory(historyArray) {
  try {
    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify(historyArray));
  } catch (err) {
    console.error('Failed to set scan history:', err);
  }
}

/**
 * Saves a new scan result to user-scoped localStorage & remote backend
 * @param {Object} scanData 
 * @returns {Object} saved record with generated ID & timestamp
 */
export function saveScanToHistory(scanData) {
  try {
    const history = getScanHistory();
    const record = {
      id: 'scan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      thumbnail: scanData.thumbnail || scanData.image, // Base64 preview
      primaryCondition: scanData.primaryCondition || 'Skin Observation',
      confidence: scanData.confidence || 0,
      severity: scanData.severity || 'Mid',
      explanation: scanData.explanation || '',
      differentialDiagnoses: scanData.differentialDiagnoses || [],
      visualObservations: scanData.visualObservations || {},
      recommendations: scanData.recommendations || []
    };

    // Prepend new scan
    const updated = [record, ...history].slice(0, 50);
    setScanHistory(updated);

    // Sync to backend if logged in
    saveUserScanRemote(scanData).catch(err => console.warn('Remote sync skipped:', err));

    return record;
  } catch (err) {
    console.error('Failed to save scan to history:', err);
    return null;
  }
}

/**
 * Deletes a scan by ID
 * @param {string} scanId 
 */
export function deleteScanFromHistory(scanId) {
  try {
    const history = getScanHistory();
    const updated = history.filter(item => item.id !== scanId);
    setScanHistory(updated);
    return updated;
  } catch (err) {
    console.error('Failed to delete scan:', err);
    return [];
  }
}

/**
 * Clears all scan history for current user
 */
export function clearScanHistory() {
  try {
    const key = getStorageKey();
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.error('Failed to clear scan history:', err);
    return false;
  }
}

/**
 * Gets custom app settings (API Keys, selected model, etc.)
 */
export function getAppSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {
      apiKey: '',
      provider: 'claude', // 'claude' | 'gemini' | 'demo'
      model: 'claude-3-5-sonnet-20241022',
      blurThresholdStrict: false,
      saveHistoryDefault: true
    };
  } catch (err) {
    return { provider: 'demo' };
  }
}

/**
 * Saves custom app settings
 */
export function saveAppSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (err) {
    console.error('Failed to save settings:', err);
    return false;
  }
}

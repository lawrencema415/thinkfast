export const LOCALSTORAGE_KEYS = {
  VOLUME: 'think_fast_music_volume',
  // might not need to keep track of this, placeholder for now
  MUTE: 'think_fast_music_mute',
};

// TODO: Add sentry to error handling and logging in future
export function setLocalStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Optionally handle quota exceeded, etc.
    console.error('localStorage set error:', e);
  }
}

export function getLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch (e) {
    console.error('localStorage get error:', e);
    return defaultValue;
  }
}

export function removeLocalStorage(key: string) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    // Optionally handle error
    console.error('localStorage remove error:', e);
  }
}

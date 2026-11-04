export const storage = {
  get(key) {
    try {
      const item = localStorage.getItem(`brightdesk_${key}`);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`brightdesk_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error("Storage error:", e);
    }
  }
};

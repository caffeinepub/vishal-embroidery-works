const RECENTLY_VIEWED_KEY = "vew_recently_viewed";
const MAX_ITEMS = 10;

export function getRecentlyViewed(): string[] {
  try {
    const data = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return data ? (JSON.parse(data) as string[]) : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(id: string): void {
  const items = getRecentlyViewed().filter((i) => i !== id);
  items.unshift(id);
  localStorage.setItem(
    RECENTLY_VIEWED_KEY,
    JSON.stringify(items.slice(0, MAX_ITEMS)),
  );
}

export function clearRecentlyViewed(): void {
  localStorage.removeItem(RECENTLY_VIEWED_KEY);
}

const FAVOURITES_KEY = "vew_favourites";

export function getFavourites(): string[] {
  try {
    const data = localStorage.getItem(FAVOURITES_KEY);
    return data ? (JSON.parse(data) as string[]) : [];
  } catch {
    return [];
  }
}

// Returns the new favourite state (true = added, false = removed)
export function toggleFavourite(id: string): boolean {
  const favs = getFavourites();
  const idx = favs.indexOf(id);
  if (idx === -1) {
    favs.push(id);
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favs));
    return true;
  }
  favs.splice(idx, 1);
  localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favs));
  return false;
}

export function isFavourite(id: string): boolean {
  return getFavourites().includes(id);
}

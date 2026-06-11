import { Injectable, signal } from '@angular/core';

export interface FavoriteItem {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  description: string;
  badgeText: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'nasa_space_observer_favorites';
  private favoritesSignal = signal<FavoriteItem[]>([]);

  constructor() {
    this.loadFavorites();
  }

  private loadFavorites() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          this.favoritesSignal.set(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Failed to load favorites from localStorage:', err);
      }
    }
  }

  private saveFavorites(list: FavoriteItem[]) {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
      } catch (err) {
        console.error('Failed to save favorites to localStorage:', err);
      }
    }
  }

  getFavorites() {
    return this.favoritesSignal.asReadonly();
  }

  addFavorite(item: FavoriteItem) {
    const current = this.favoritesSignal();
    if (!current.some(f => f.id === item.id)) {
      const updated = [...current, item];
      this.favoritesSignal.set(updated);
      this.saveFavorites(updated);
    }
  }

  removeFavorite(id: string) {
    const current = this.favoritesSignal();
    const updated = current.filter(f => f.id !== id);
    this.favoritesSignal.set(updated);
    this.saveFavorites(updated);
  }

  isFavorite(id: string): boolean {
    return this.favoritesSignal().some(f => f.id === id);
  }
}

import { Injectable, signal, effect } from '@angular/core';

type Theme = 'light' | 'dark';
const THEME_KEY = 'admin_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.loadTheme());

  constructor() {
    effect(() => {
      const t = this.theme();
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem(THEME_KEY, t);
    });
  }

  toggle(): void {
    this.theme.update((t: any) => (t === 'light' ? 'dark' : 'light'));
  }

  private loadTheme(): Theme {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
    return 'light';
  }
}

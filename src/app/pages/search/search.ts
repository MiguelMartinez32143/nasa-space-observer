import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.html',
  styleUrl: './search.css'
})
export class SearchComponent {
  protected query = signal<string>('');
  protected history = signal<string[]>([
    'Curiosity Sol 1000',
    'Mars Perseverance',
    'APOD Nebula'
  ]);

  protected onSearch(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    const val = this.query().trim();
    if (val && !this.history().includes(val)) {
      this.history.update(h => [val, ...h].slice(0, 5));
    }
  }

  protected useHistory(item: string) {
    this.query.set(item);
    this.onSearch();
  }

  protected clearHistory() {
    this.history.set([]);
  }
}

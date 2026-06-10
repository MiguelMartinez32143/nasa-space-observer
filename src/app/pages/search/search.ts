import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../components/card/card';
import { NasaService } from '../../services/nasa.service';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface SearchResultItem {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  description: string;
  badgeText: string;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './search.html',
  styleUrl: './search.css'
})
export class SearchComponent {
  private nasaService = inject(NasaService);

  protected query = signal<string>('');
  protected history = signal<string[]>([
    'Curiosity Sol 1000',
    'Mars Perseverance',
    'APOD Nebula'
  ]);

  private popularSuggestions = [
    'Curiosity Sol 1000',
    'Mars Perseverance',
    'Spirit Rover',
    'Opportunity Rover',
    'APOD Nebula',
    'Orion Nebula',
    'Andromeda Galaxy',
    'Hubble Telescope',
    'Black Hole',
    'Apollo 11',
    'Saturn Rings',
    'Jupiter Great Red Spot',
    'Earth from Space',
    'Solar Flare'
  ];

  protected results = signal<SearchResultItem[]>([]);
  protected loading = signal<boolean>(false);
  protected error = signal<string | null>(null);
  protected hasSearched = signal<boolean>(false);

  protected showSuggestions = signal<boolean>(false);
  protected activeSuggestionIndex = signal<number>(-1);
  private lastSearchedQuery = '';

  protected filteredSuggestions = computed(() => {
    const queryVal = this.query().trim().toLowerCase();
    
    if (!queryVal) {
      return {
        history: this.history(),
        popular: this.popularSuggestions.filter(p => !this.history().includes(p)).slice(0, 6)
      };
    }

    const historyFiltered = this.history().filter(h => 
      h.toLowerCase().includes(queryVal)
    );

    const popularFiltered = this.popularSuggestions.filter(p => 
      p.toLowerCase().includes(queryVal) && !this.history().includes(p)
    );

    return {
      history: historyFiltered,
      popular: popularFiltered
    };
  });

  protected flatSuggestions = computed(() => {
    const sug = this.filteredSuggestions();
    return [...sug.history, ...sug.popular];
  });

  constructor() {
    toObservable(this.query)
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed()
      )
      .subscribe(val => {
        const cleanVal = val.trim();
        if (cleanVal.length >= 3) {
          if (cleanVal !== this.lastSearchedQuery) {
            this.onSearch();
          }
        } else if (cleanVal.length === 0) {
          this.results.set([]);
          this.hasSearched.set(false);
          this.error.set(null);
          this.lastSearchedQuery = '';
        }
      });
  }

  protected onSearch(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    
    const val = this.query().trim();
    if (!val) {
      return;
    }

    // Hide suggestions dropdown on search
    this.showSuggestions.set(false);
    this.activeSuggestionIndex.set(-1);

    // Avoid duplicate requests
    if (this.lastSearchedQuery === val && !this.error() && this.hasSearched()) {
      return;
    }
    this.lastSearchedQuery = val;

    // Add to history
    if (!this.history().includes(val)) {
      this.history.update(h => [val, ...h].slice(0, 5));
    }

    this.loading.set(true);
    this.error.set(null);
    this.hasSearched.set(true);
    this.results.set([]);

    const isRoverQuery = /rover|curiosity|opportunity|spirit|perseverance|sol/i.test(val);

    if (isRoverQuery) {
      const { rover, sol, camera } = this.parseRoverQuery(val);
      this.nasaService.getRoverPhotos(rover, sol, camera, 1).subscribe({
        next: (response) => {
          if (response.photos && response.photos.length > 0) {
            const mapped = response.photos.map(p => ({
              id: `rover-${p.id}`,
              imageUrl: p.img_src,
              title: p.camera.full_name,
              subtitle: `${p.rover.name} • Sol ${p.sol}`,
              description: `Capturada en la fecha terrestre ${p.earth_date} utilizando la cámara ${p.camera.name}.`,
              badgeText: p.camera.name
            }));
            this.results.set(mapped);
          } else {
            this.results.set([]);
          }
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error fetching rover photos for search:', err);
          this.error.set('Error al conectar con la base de datos de Marte. Por favor, intente de nuevo.');
          this.loading.set(false);
        }
      });
    } else {
      const translatedVal = this.translateQuery(val);
      this.nasaService.searchNasaImages(translatedVal).subscribe({
        next: (response) => {
          const items = response?.collection?.items || [];
          const mapped = items.map((item: any) => {
            const data = item.data?.[0] || {};
            const link = item.links?.[0] || {};
            return {
              id: `apod-${data.nasa_id}`,
              imageUrl: link.href || '',
              title: data.title || 'Imagen de la NASA',
              subtitle: (data.center ? `${data.center} • ` : '') + (data.date_created ? new Date(data.date_created).toLocaleDateString() : ''),
              description: data.description || '',
              badgeText: data.center || 'NASA'
            };
          });
          // Filter out results with empty images
          this.results.set(mapped.filter((item: any) => item.imageUrl));
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error searching NASA library:', err);
          this.error.set('Error al conectar con la biblioteca de imágenes de la NASA.');
          this.loading.set(false);
        }
      });
    }
  }

  protected selectSuggestion(item: string) {
    this.query.set(item);
    this.showSuggestions.set(false);
    this.activeSuggestionIndex.set(-1);
    this.onSearch();
  }

  protected useHistory(item: string) {
    this.selectSuggestion(item);
  }

  protected clearHistory() {
    this.history.set([]);
  }

  protected clearSearch() {
    this.query.set('');
    this.results.set([]);
    this.hasSearched.set(false);
    this.error.set(null);
    this.lastSearchedQuery = '';
    this.showSuggestions.set(false);
    this.activeSuggestionIndex.set(-1);
  }

  protected onBlurInput() {
    // Small timeout to allow click events on suggestions list to register
    setTimeout(() => {
      this.showSuggestions.set(false);
      this.activeSuggestionIndex.set(-1);
    }, 200);
  }

  protected onKeyDown(event: KeyboardEvent) {
    const suggestions = this.flatSuggestions();
    if (!this.showSuggestions() || suggestions.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeSuggestionIndex.update(idx => 
        idx < suggestions.length - 1 ? idx + 1 : 0
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeSuggestionIndex.update(idx => 
        idx > 0 ? idx - 1 : suggestions.length - 1
      );
    } else if (event.key === 'Enter') {
      const idx = this.activeSuggestionIndex();
      if (idx >= 0 && idx < suggestions.length) {
        event.preventDefault();
        this.selectSuggestion(suggestions[idx]);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.showSuggestions.set(false);
      this.activeSuggestionIndex.set(-1);
    }
  }

  private translateQuery(val: string): string {
    let query = val.toLowerCase().trim();

    const dictionary: { [key: string]: string } = {
      'marte': 'mars',
      'luna': 'moon',
      'nebulosa': 'nebula',
      'galaxia': 'galaxy',
      'agujero negro': 'black hole',
      'agujeros negros': 'black holes',
      'tierra': 'earth',
      'sol': 'sun',
      'cohete': 'rocket',
      'cohetes': 'rockets',
      'astronauta': 'astronaut',
      'astronautas': 'astronauts',
      'telescopio': 'telescope',
      'telescopios': 'telescopes',
      'estrella': 'star',
      'estrellas': 'stars',
      'planeta': 'planet',
      'planetas': 'planets',
      'via lactea': 'milky way',
      'vía láctea': 'milky way',
      'universo': 'universe',
      'sistema solar': 'solar system',
      'saturno': 'saturn',
      'jupiter': 'jupiter',
      'júpiter': 'jupiter',
      'neptuno': 'neptune',
      'urano': 'uranus',
      'mercurio': 'mercury',
      'venus': 'venus',
      'pluton': 'pluto',
      'plutón': 'pluto',
      'cometa': 'comet',
      'cometas': 'comets',
      'asteroide': 'asteroid',
      'asteroides': 'asteroids',
      'eclipse': 'eclipse',
      'aurora': 'aurora',
      'espacio': 'space',
      'transbordador': 'shuttle',
      'estacion espacial': 'space station',
      'estación espacial': 'space station'
    };

    for (const [key, translation] of Object.entries(dictionary)) {
      const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedKey}\\b`, 'gi');
      query = query.replace(regex, translation);
    }

    return query;
  }

  private parseRoverQuery(val: string) {
    const query = val.toLowerCase();
    
    let rover = 'curiosity';
    if (query.includes('opportunity')) {
      rover = 'opportunity';
    } else if (query.includes('spirit')) {
      rover = 'spirit';
    } else if (query.includes('perseverance')) {
      rover = 'perseverance';
    }

    let sol = 1000;
    const solMatch = query.match(/sol\s*(\d+)/i) || query.match(/\b(\d+)\b/);
    if (solMatch) {
      sol = parseInt(solMatch[1], 10);
    }

    const cameras = ['fhaz', 'rhaz', 'mast', 'chemcam', 'mahli', 'mardi', 'navcam', 'pancam', 'minites'];
    let camera: string | undefined;
    for (const cam of cameras) {
      if (query.includes(cam)) {
        camera = cam.toUpperCase();
        break;
      }
    }

    return { rover, sol, camera };
  }
}


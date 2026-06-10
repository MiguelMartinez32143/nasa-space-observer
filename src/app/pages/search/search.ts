import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../components/card/card';
import { NasaService } from '../../services/nasa.service';

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

  protected results = signal<SearchResultItem[]>([]);
  protected loading = signal<boolean>(false);
  protected error = signal<string | null>(null);
  protected hasSearched = signal<boolean>(false);

  protected onSearch(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    
    const val = this.query().trim();
    if (!val) {
      return;
    }

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
      this.nasaService.searchNasaImages(val).subscribe({
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

  protected useHistory(item: string) {
    this.query.set(item);
    this.onSearch();
  }

  protected clearHistory() {
    this.history.set([]);
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

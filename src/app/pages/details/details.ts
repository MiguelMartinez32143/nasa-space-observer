import { Component, input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { NasaService } from '../../services/nasa.service';
import { FavoritesService } from '../../services/favorites.service';
import { UiService } from '../../services/ui.service';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './details.html',
  styleUrl: './details.css'
})
export class DetailsComponent {
  private nasaService = inject(NasaService);
  protected favoritesService = inject(FavoritesService);
  private uiService = inject(UiService);

  id = input.required<string>();

  // State signals
  protected imageUrl = signal<string>('');
  protected title = signal<string>('');
  protected subtitle = signal<string>('');
  protected description = signal<string>('');
  protected badgeText = signal<string>('');
  protected isLoading = signal<boolean>(true);
  protected hasError = signal<boolean>(false);

  protected isRover = computed(() => this.id().startsWith('rover-'));
  protected isFavorited = computed(() => this.favoritesService.isFavorite(this.id()));
  
  protected telemetry = computed(() => {
    const rawId = this.id();
    if (rawId.startsWith('rover-')) {
      const numericId = rawId.replace('rover-', '');
      return {
        id: numericId,
        instrument: this.title() || 'Mast Camera (Mastcam)',
        rover: 'Curiosity',
        sol: '1000',
        earthDate: '2015-05-30',
        status: 'Operational',
        sensorTemp: '-32°C',
        altitude: '-4400 m',
        coords: '4.6° S, 137.4° E',
        exposure: '120ms',
        filter: 'L0_Red (640nm)',
        fileSize: '4.2 MB',
        copyright: 'NASA Public Domain'
      };
    } else {
      const date = rawId.replace('apod-', '');
      return {
        id: date,
        instrument: this.title() || 'Astronomy Picture of the Day',
        provider: 'NASA Space Observatories',
        date: date || '2026-06-04',
        copyright: 'NASA Public Domain',
        spectralBand: 'Visible Light / IR',
        resolution: '4096 x 2732 px',
        processing: 'Hubble Pipeline v4.2',
        location: 'Earth Orbit (HST)',
        fileSize: '18.4 MB',
        exposure: '1500s'
      };
    }
  });

  constructor() {
    toObservable(this.id)
      .pipe(
        switchMap(rawId => {
          this.isLoading.set(true);
          this.hasError.set(false);
          this.imageUrl.set('');
          this.title.set('');
          this.subtitle.set('');
          this.description.set('');
          this.badgeText.set('');

          if (rawId.startsWith('rover-')) {
            const numericId = parseInt(rawId.replace('rover-', ''), 10);
            return this.nasaService.getRoverPhotoById(numericId).pipe(
              switchMap(photo => {
                if (photo) {
                  this.imageUrl.set(photo.img_src);
                  this.title.set(photo.camera.full_name);
                  this.subtitle.set(`${photo.rover.name} • Sol ${photo.sol}`);
                  this.description.set(`Capturada en la fecha terrestre ${photo.earth_date} utilizando la cámara ${photo.camera.name}.`);
                  this.badgeText.set(photo.camera.name);
                } else {
                  this.hasError.set(true);
                }
                this.isLoading.set(false);
                return [];
              })
            );
          } else {
            const cleanId = rawId.replace('apod-', '');
            const isDateFormat = /^\d{4}-\d{2}-\d{2}$/.test(cleanId);

            if (isDateFormat) {
              return this.nasaService.getApod(cleanId).pipe(
                switchMap(apod => {
                  if (apod) {
                    this.imageUrl.set(apod.url);
                    this.title.set(apod.title);
                    this.subtitle.set(`${apod.date} • APOD`);
                    this.description.set(apod.explanation);
                    this.badgeText.set('APOD');
                  } else {
                    this.hasError.set(true);
                  }
                  this.isLoading.set(false);
                  return [];
                })
              );
            } else {
              return this.nasaService.getNasaImageById(cleanId).pipe(
                switchMap(response => {
                  const items = response?.collection?.items || [];
                  if (items.length > 0) {
                    const item = items[0];
                    const data = item.data?.[0] || {};
                    const link = item.links?.[0] || {};
                    this.imageUrl.set(link.href || '');
                    this.title.set(data.title || 'Imagen de la NASA');
                    this.subtitle.set((data.center ? `${data.center} • ` : '') + (data.date_created ? new Date(data.date_created).toLocaleDateString() : ''));
                    this.description.set(data.description || '');
                    this.badgeText.set(data.center || 'NASA');
                  } else {
                    this.hasError.set(true);
                  }
                  this.isLoading.set(false);
                  return [];
                })
              );
            }
          }
        })
      )
      .subscribe({
        error: (err) => {
          console.error('Error fetching details:', err);
          this.hasError.set(true);
          this.isLoading.set(false);
        }
      });
  }

  protected toggleFavorite() {
    const item = {
      id: this.id(),
      imageUrl: this.imageUrl(),
      title: this.title(),
      subtitle: this.subtitle(),
      description: this.description(),
      badgeText: this.badgeText()
    };

    if (this.isFavorited()) {
      this.favoritesService.removeFavorite(item.id);
      this.uiService.showToast('Eliminado de Favoritos', 'info');
    } else {
      this.favoritesService.addFavorite(item);
      this.uiService.showToast('¡Guardado en Favoritos!', 'success');
    }
  }
}

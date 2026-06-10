import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NasaService, ApodResponse, RoverPhoto } from '../../services/nasa.service';
import { CardComponent } from '../../components/card/card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CardComponent, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  private nasaService = inject(NasaService);

  // States using Signals
  protected apod = signal<ApodResponse | null>(null);
  protected roverPhotos = signal<RoverPhoto[]>([]);
  protected loadingApod = signal<boolean>(true);
  protected loadingPhotos = signal<boolean>(true);
  protected errorApod = signal<string | null>(null);
  protected errorPhotos = signal<string | null>(null);

  // Paging states
  protected currentPage = signal<number>(1);
  protected loadingMore = signal<boolean>(false);
  protected hasMore = signal<boolean>(true);

  // Sentinel setup for infinite scroll
  private sentinel?: ElementRef;
  private observer?: IntersectionObserver;

  @ViewChild('infiniteScrollSentinel', { static: false }) set sentinelRef(element: ElementRef | undefined) {
    if (element) {
      this.sentinel = element;
      this.setupIntersectionObserver();
    } else {
      this.sentinel = undefined;
      this.observer?.disconnect();
    }
  }

  ngOnInit() {
    this.fetchApod();
    this.fetchRoverPhotos();
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private fetchApod() {
    this.loadingApod.set(true);
    this.errorApod.set(null);
    this.nasaService.getApod().subscribe({
      next: (data) => {
        this.apod.set(data);
        this.loadingApod.set(false);
      },
      error: (err) => {
        this.errorApod.set('No se pudo cargar la Foto del Día.');
        this.loadingApod.set(false);
        console.error('Error fetching APOD:', err);
      }
    });
  }

  private fetchRoverPhotos() {
    this.loadingPhotos.set(true);
    this.errorPhotos.set(null);
    this.currentPage.set(1);
    this.hasMore.set(true);
    
    this.nasaService.getRoverPhotos('curiosity', 1000, undefined, 1).subscribe({
      next: (response) => {
        this.roverPhotos.set(response.photos);
        this.loadingPhotos.set(false);
        if (!response.photos || response.photos.length < 25) {
          this.hasMore.set(false);
        }
      },
      error: (err) => {
        this.errorPhotos.set('No se pudieron cargar las fotos de Marte.');
        this.loadingPhotos.set(false);
        console.error('Error fetching rover photos:', err);
      }
    });
  }

  protected loadMoreRoverPhotos() {
    if (this.loadingMore() || !this.hasMore()) {
      return;
    }
    this.loadingMore.set(true);
    const nextPage = this.currentPage() + 1;
    
    this.nasaService.getRoverPhotos('curiosity', 1000, undefined, nextPage).subscribe({
      next: (response) => {
        if (response.photos && response.photos.length > 0) {
          this.roverPhotos.update(current => {
            const existingIds = new Set(current.map(p => p.id));
            const newPhotos = response.photos.filter(p => !existingIds.has(p.id));
            return [...current, ...newPhotos];
          });
          this.currentPage.set(nextPage);
          if (response.photos.length < 25) {
            this.hasMore.set(false);
          }
        } else {
          this.hasMore.set(false);
        }
        this.loadingMore.set(false);
      },
      error: (err) => {
        console.error('Error loading more rover photos:', err);
        this.loadingMore.set(false);
      }
    });
  }

  private setupIntersectionObserver() {
    if (!this.sentinel) return;

    this.observer?.disconnect();

    const options = {
      root: null,
      rootMargin: '200px',
      threshold: 0.1
    };

    this.observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !this.loadingPhotos() && !this.loadingMore() && this.hasMore()) {
        this.loadMoreRoverPhotos();
      }
    }, options);

    this.observer.observe(this.sentinel.nativeElement);
  }
}

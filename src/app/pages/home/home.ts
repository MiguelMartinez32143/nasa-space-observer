import { Component, OnInit, inject, signal } from '@angular/core';
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
export class HomeComponent implements OnInit {
  private nasaService = inject(NasaService);

  // States using Signals
  protected apod = signal<ApodResponse | null>(null);
  protected roverPhotos = signal<RoverPhoto[]>([]);
  protected loadingApod = signal<boolean>(true);
  protected loadingPhotos = signal<boolean>(true);
  protected errorApod = signal<string | null>(null);
  protected errorPhotos = signal<string | null>(null);

  ngOnInit() {
    this.fetchApod();
    this.fetchRoverPhotos();
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
    // Fetch photos from Curiosity, Sol 1000
    this.nasaService.getRoverPhotos('curiosity', 1000).subscribe({
      next: (response) => {
        // Take first 12 photos for the dashboard grid
        this.roverPhotos.set(response.photos.slice(0, 12));
        this.loadingPhotos.set(false);
      },
      error: (err) => {
        this.errorPhotos.set('No se pudieron cargar las fotos de Marte.');
        this.loadingPhotos.set(false);
        console.error('Error fetching rover photos:', err);
      }
    });
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NasaService, ApodResponse, RoverPhoto } from './services/nasa.service';
import { DiagnosticsService } from './services/diagnostics.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private nasaService = inject(NasaService);
  protected diagnosticsService = inject(DiagnosticsService);

  // APOD State
  protected apod = signal<ApodResponse | null>(null);
  protected loadingApod = signal<boolean>(false);
  protected errorApod = signal<string | null>(null);

  // Mars Rover State
  protected rovers = ['Curiosity', 'Opportunity', 'Spirit'];
  protected selectedRover = signal<string>('Curiosity');
  protected sol = signal<number>(1000);
  protected selectedCamera = signal<string>('ALL');
  protected roverPhotos = signal<RoverPhoto[]>([]);
  protected loadingRover = signal<boolean>(false);
  protected errorRover = signal<string | null>(null);
  protected pages = signal<number>(1);

  // Available cameras per rover (commonly available ones)
  protected cameras = [
    { code: 'ALL', name: 'All Cameras' },
    { code: 'FHAZ', name: 'Front Hazard Avoidance Camera' },
    { code: 'RHAZ', name: 'Rear Hazard Avoidance Camera' },
    { code: 'MAST', name: 'Mast Camera' },
    { code: 'CHEMCAM', name: 'Chemistry and Camera Complex' },
    { code: 'MAHLI', name: 'Mars Hand Lens Imager' },
    { code: 'MARDI', name: 'Mars Descent Imager' },
    { code: 'NAVCAM', name: 'Navigation Camera' },
    { code: 'PANCAM', name: 'Panoramic Camera' },
    { code: 'MINITES', name: 'Miniature Thermal Emission Spectrometer' }
  ];

  // Lightbox State
  protected activeLightboxPhoto = signal<RoverPhoto | null>(null);

  // Console visibility
  protected showConsole = signal<boolean>(true);

  ngOnInit() {
    this.fetchApod();
    this.fetchRoverPhotos();
  }

  fetchApod() {
    this.loadingApod.set(true);
    this.errorApod.set(null);
    this.nasaService.getApod().subscribe({
      next: (data) => {
        this.apod.set(data);
        this.loadingApod.set(false);
      },
      error: (err) => {
        this.errorApod.set('Failed to load Astronomy Picture of the Day.');
        this.loadingApod.set(false);
        console.error(err);
      }
    });
  }

  fetchRoverPhotos() {
    this.loadingRover.set(true);
    this.errorRover.set(null);
    
    this.nasaService.getRoverPhotos(
      this.selectedRover(),
      this.sol(),
      this.selectedCamera(),
      this.pages()
    ).subscribe({
      next: (res) => {
        this.roverPhotos.set(res.photos || []);
        this.loadingRover.set(false);
        if (!res.photos || res.photos.length === 0) {
          this.errorRover.set('No photos found for this combination of Rover, Sol, and Camera.');
        }
      },
      error: (err) => {
        this.errorRover.set('Error fetching Mars Rover photos.');
        this.loadingRover.set(false);
        console.error(err);
      }
    });
  }

  onRoverChange(rover: string) {
    this.selectedRover.set(rover);
    this.pages.set(1);
    this.fetchRoverPhotos();
  }

  onSolChange(newSol: number) {
    if (newSol < 0) newSol = 0;
    this.sol.set(newSol);
    this.pages.set(1);
    this.fetchRoverPhotos();
  }

  onCameraChange(camera: string) {
    this.selectedCamera.set(camera);
    this.pages.set(1);
    this.fetchRoverPhotos();
  }

  changePage(delta: number) {
    const newPage = this.pages() + delta;
    if (newPage >= 1) {
      this.pages.set(newPage);
      this.fetchRoverPhotos();
    }
  }

  openLightbox(photo: RoverPhoto) {
    this.activeLightboxPhoto.set(photo);
  }

  closeLightbox() {
    this.activeLightboxPhoto.set(null);
  }

  clearLogs() {
    // Just a placeholder since the service returns a readonly signal
  }

  toggleConsole() {
    this.showConsole.update(v => !v);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, timeout } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ApodResponse {
  date: string;
  explanation: string;
  hdurl?: string;
  media_type: string;
  service_version: string;
  title: string;
  url: string;
  copyright?: string;
}

export interface RoverCamera {
  id: number;
  name: string;
  rover_id: number;
  full_name: string;
}

export interface RoverInfo {
  id: number;
  name: string;
  landing_date: string;
  launch_date: string;
  status: string;
}

export interface RoverPhoto {
  id: number;
  sol: number;
  camera: RoverCamera;
  img_src: string;
  earth_date: string;
  rover: RoverInfo;
}

export interface RoverPhotosResponse {
  photos: RoverPhoto[];
}

// Robust fallback data for APOD (Astronomy Picture of the Day)
const MOCK_APOD: ApodResponse = {
  date: '2026-06-04',
  explanation: 'Esta vista telescópica en luz visible y cercana al infrarrojo revela los intrincados detalles y filamentos de gas caliente en la Nebulosa del Velo, una gran remanente de supernova ubicada en la constelación de Cygnus. Esta imagen utiliza procesamiento de precisión para destacar la colisión de la onda de choque en expansión con nubes de gas interestelar de alta densidad.',
  title: 'Filamentos en la Nebulosa del Velo (Mapeo Óptico)',
  media_type: 'image',
  service_version: 'v1',
  url: 'https://images-assets.nasa.gov/image/hubble-uncovers-a-hidden-galaxy_28359740523_o/hubble-uncovers-a-hidden-galaxy_28359740523_o~thumb.jpg',
  hdurl: 'https://images-assets.nasa.gov/image/hubble-uncovers-a-hidden-galaxy_28359740523_o/hubble-uncovers-a-hidden-galaxy_28359740523_o~thumb.jpg',
  copyright: 'NASA, ESA, Hubble Heritage Team'
};

// Generated high-fidelity mock data for Mars Rover Photos to support local paging and infinite scroll
const CAMERAS = [
  { name: 'MAST', full_name: 'Mast Camera (Mastcam)' },
  { name: 'FHAZ', full_name: 'Front Hazard Avoidance Camera' },
  { name: 'RHAZ', full_name: 'Rear Hazard Avoidance Camera' },
  { name: 'NAVCAM', full_name: 'Navigation Camera' },
  { name: 'CHEMCAM', full_name: 'Chemistry and Camera Complex' },
  { name: 'MAHLI', full_name: 'Mars Hand Lens Imager' }
];

const IMAGE_IDS = [
  'PIA19808', 'PIA16225', 'PIA16239', 'PIA19820', 'PIA19821', 'PIA22221',
  'PIA22222', 'PIA22223', 'PIA23221', 'PIA23222', 'PIA23223', 'PIA23224'
];

const GENERATED_ROVER_PHOTOS: RoverPhoto[] = [];
for (let i = 0; i < 48; i++) {
  const imgId = IMAGE_IDS[i % IMAGE_IDS.length];
  const cam = CAMERAS[i % CAMERAS.length];
  GENERATED_ROVER_PHOTOS.push({
    id: 10001 + i,
    sol: 1000,
    camera: {
      id: 20 + (i % CAMERAS.length),
      name: cam.name,
      rover_id: 5,
      full_name: cam.full_name
    },
    img_src: `https://images-assets.nasa.gov/image/${imgId}/${imgId}~thumb.jpg`,
    earth_date: '2015-05-30',
    rover: {
      id: 5,
      name: 'Curiosity',
      landing_date: '2012-08-06',
      launch_date: '2011-11-26',
      status: 'active'
    }
  });
}

const MOCK_ROVER_PHOTOS: RoverPhotosResponse = {
  photos: GENERATED_ROVER_PHOTOS.slice(0, 4)
};

@Injectable({
  providedIn: 'root'
})
export class NasaService {
  private http = inject(HttpClient);
  private apiUrl = environment.nasaApiUrl;

  /**
   * Fetch Astronomy Picture of the Day (APOD)
   * Falls back to local MOCK_APOD on network error.
   */
  getApod(date?: string): Observable<ApodResponse> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date);
    }
    return this.http.get<ApodResponse>(`${this.apiUrl}/planetary/apod`, { params }).pipe(
      timeout(4000),
      catchError((err) => {
        console.warn('NASA APOD API error, returning local fallback data:', err);
        return of(MOCK_APOD);
      })
    );
  }  /**
   * Fetch Mars Rover photos for a specific rover, sol, and optional camera.
   * Returns locally paginated mock photos because the NASA API endpoint is archived/deprecated.
   */
  getRoverPhotos(rover: string, sol: number, camera?: string, page: number = 1): Observable<RoverPhotosResponse> {
    let filtered = GENERATED_ROVER_PHOTOS.filter(p =>
      p.rover.name.toLowerCase() === rover.toLowerCase()
    );

    if (camera) {
      filtered = filtered.filter(p => p.camera.name.toLowerCase() === camera.toLowerCase());
    }

    const pageSize = 12;
    const startIndex = (page - 1) * pageSize;
    const paginatedPhotos = filtered.slice(startIndex, startIndex + pageSize);

    return of({ photos: paginatedPhotos });
  }

  /**
   * Search NASA Image and Video Library
   */
  searchNasaImages(query: string): Observable<any> {
    const params = new HttpParams()
      .set('q', query)
      .set('media_type', 'image');

    return this.http.get<any>(`https://images-api.nasa.gov/search`, { params }).pipe(
      timeout(8000),
      catchError((err) => {
        console.error('NASA Image Library search error:', err);
        return of({ collection: { items: [] } });
      })
    );
  }
}

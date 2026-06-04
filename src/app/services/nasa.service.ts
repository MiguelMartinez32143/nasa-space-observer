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

// Robust fallback data for Mars Rover Photos (Curiosity, Sol 1000)
const MOCK_ROVER_PHOTOS: RoverPhotosResponse = {
  photos: [
    {
      id: 10001,
      sol: 1000,
      camera: {
        id: 20,
        name: 'MAST',
        rover_id: 5,
        full_name: 'Mast Camera (Mastcam)'
      },
      img_src: 'https://images-assets.nasa.gov/image/PIA19808/PIA19808~thumb.jpg',
      earth_date: '2015-05-30',
      rover: {
        id: 5,
        name: 'Curiosity',
        landing_date: '2012-08-06',
        launch_date: '2011-11-26',
        status: 'active'
      }
    },
    {
      id: 10002,
      sol: 1000,
      camera: {
        id: 21,
        name: 'FHAZ',
        rover_id: 5,
        full_name: 'Front Hazard Avoidance Camera'
      },
      img_src: 'https://images-assets.nasa.gov/image/PIA16225/PIA16225~thumb.jpg',
      earth_date: '2015-05-30',
      rover: {
        id: 5,
        name: 'Curiosity',
        landing_date: '2012-08-06',
        launch_date: '2011-11-26',
        status: 'active'
      }
    },
    {
      id: 10003,
      sol: 1000,
      camera: {
        id: 22,
        name: 'RHAZ',
        rover_id: 5,
        full_name: 'Rear Hazard Avoidance Camera'
      },
      img_src: 'https://images-assets.nasa.gov/image/PIA16239/PIA16239~thumb.jpg',
      earth_date: '2015-05-30',
      rover: {
        id: 5,
        name: 'Curiosity',
        landing_date: '2012-08-06',
        launch_date: '2011-11-26',
        status: 'active'
      }
    },
    {
      id: 10004,
      sol: 1000,
      camera: {
        id: 20,
        name: 'MAST',
        rover_id: 5,
        full_name: 'Mast Camera (Mastcam)'
      },
      img_src: 'https://images-assets.nasa.gov/image/PIA19808/PIA19808~thumb.jpg',
      earth_date: '2015-05-30',
      rover: {
        id: 5,
        name: 'Curiosity',
        landing_date: '2012-08-06',
        launch_date: '2011-11-26',
        status: 'active'
      }
    }
  ]
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
   * Returns local MOCK_ROVER_PHOTOS directly as the NASA API is archived/deprecated.
   */
  getRoverPhotos(rover: string, sol: number, camera?: string, page: number = 1): Observable<RoverPhotosResponse> {
    return of(MOCK_ROVER_PHOTOS);
  }
}

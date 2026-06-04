import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class NasaService {
  private http = inject(HttpClient);
  private apiUrl = environment.nasaApiUrl;

  /**
   * Fetch Astronomy Picture of the Day (APOD)
   * @param date Optional date in YYYY-MM-DD format
   */
  getApod(date?: string): Observable<ApodResponse> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date);
    }
    return this.http.get<ApodResponse>(`${this.apiUrl}/planetary/apod`, { params });
  }

  /**
   * Fetch Mars Rover photos for a specific rover, sol, and optional camera
   */
  getRoverPhotos(rover: string, sol: number, camera?: string, page: number = 1): Observable<RoverPhotosResponse> {
    let params = new HttpParams().set('sol', sol.toString()).set('page', page.toString());
    if (camera && camera !== 'ALL') {
      params = params.set('camera', camera);
    }
    
    const roverName = rover.toLowerCase();
    return this.http.get<RoverPhotosResponse>(`${this.apiUrl}/mars-photos/api/v1/rovers/${roverName}/photos`, { params });
  }
}

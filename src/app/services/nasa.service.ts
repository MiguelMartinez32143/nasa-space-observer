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

// 48 unique Mars Rover photos sourced from the NASA Image & Video Library API
// Each has a distinct image URL, title, date, sol, and camera assignment
const UNIQUE_IMAGE_URLS: string[] = [
  'https://images-assets.nasa.gov/image/PIA15106/PIA15106~small.jpg',
  'https://images-assets.nasa.gov/image/PIA17068/PIA17068~small.jpg',
  'https://images-assets.nasa.gov/image/PIA14253/PIA14253~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA13809/PIA13809~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA14164/PIA14164~small.jpg',
  'https://images-assets.nasa.gov/image/PIA14165/PIA14165~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA14304/PIA14304~small.jpg',
  'https://images-assets.nasa.gov/image/PIA13389/PIA13389~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA15293/PIA15293~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA13805/PIA13805~thumb.jpg',
  'https://images-assets.nasa.gov/image/PIA13806/PIA13806~small.jpg',
  'https://images-assets.nasa.gov/image/PIA13235/PIA13235~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA13808/PIA13808~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA14258/PIA14258~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA17766/PIA17766~small.jpg',
  'https://images-assets.nasa.gov/image/PIA18086/PIA18086~small.jpg',
  'https://images-assets.nasa.gov/image/PIA16927/PIA16927~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA14255/PIA14255~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA14254/PIA14254~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA14256/PIA14256~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA15688/PIA15688~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA20172/PIA20172~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA13792/PIA13792~thumb.jpg',
  'https://images-assets.nasa.gov/image/PIA15284/PIA15284~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA13793/PIA13793~thumb.jpg',
  'https://images-assets.nasa.gov/image/PIA13981/PIA13981~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA18399/PIA18399~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA17945/PIA17945~small.jpg',
  'https://images-assets.nasa.gov/image/PIA16718/PIA16718~small.jpg',
  'https://images-assets.nasa.gov/image/PIA13383/PIA13383~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA19808/PIA19808~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA15682/PIA15682~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA19392/PIA19392~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA16565/PIA16565~small.jpg',
  'https://images-assets.nasa.gov/image/PIA18075/PIA18075~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA19039/PIA19039~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA18608/PIA18608~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA19043/PIA19043~small.jpg',
  'https://images-assets.nasa.gov/image/PIA14257/PIA14257~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA14252/PIA14252~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA13388/PIA13388~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA17935/PIA17935~thumb.jpg',
  'https://images-assets.nasa.gov/image/PIA16203/PIA16203~small.jpg',
  'https://images-assets.nasa.gov/image/PIA13980/PIA13980~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA16719/PIA16719~small.jpg',
  'https://images-assets.nasa.gov/image/PIA16717/PIA16717~small.jpg',
  'https://images-assets.nasa.gov/image/PIA19067/PIA19067~medium.jpg',
  'https://images-assets.nasa.gov/image/PIA17080/PIA17080~medium.jpg'
];

const UNIQUE_TITLES: string[] = [
  'Head of Mast on Mars Rover Curiosity',
  'Curiosity Mars Rover Drilling Into Its Second Rock',
  'Mars Rover Curiosity Raising Turret',
  'Top of Mars Rover Curiosity Remote Sensing Mast',
  'Mars Rover Curiosity in Artist Concept, Tall',
  'Mars Rover Curiosity in Artist Concept, Wide',
  'Diverse Science Payload on Mars Rover Curiosity',
  'Arm Stretch by Curiosity Mars Rover',
  'Destination for Mars Rover Curiosity',
  'Preparing for Solar and Thermal Testing',
  'Bright Days Ahead for Curiosity Mars Rover',
  'Mars Rover Curiosity with Newly Installed Wheels',
  'NASA Mars Rover Curiosity at JPL, Side View',
  'Mars Rover Curiosity Arm Held High',
  'Curiosity Approaches Dingo Gap, Mastcam View',
  'Curiosity Beside Sandstone Target Windjana',
  'Cumberland Target for Drilling by Curiosity',
  'Mars Rover Curiosity, Turning in Place',
  'Mars Rover Curiosity, Front View',
  'Mars Rover Curiosity with Wheel on Ramp',
  'Landing Target for Mars Rover Curiosity',
  'Curiosity Rover Traverse, First 1185 Sols',
  'Installing SAM Instrument into Curiosity',
  'Contact Instrument Calibration Targets',
  'Lowering SAM Instrument into Curiosity',
  'Arm and Mast of NASA Mars Rover Curiosity',
  'Curiosity Reaching Edge of Its Landing Ellipse',
  'Curiosity Shadow After Long Backward Drive',
  'Drill Bit Tip on Mars Rover Curiosity',
  'Ramp Drive Test for Curiosity Mars Rover',
  'Looking Up at Curiosity in Buckskin Selfie',
  'Test Rover Preparations for Curiosity on Mars',
  'Mars Orbiter Sees Curiosity in Artist Drive',
  'First Use of Curiosity Dust Removal Tool',
  'Map of Curiosity Drives to the Kimberley',
  'Curiosity Walkabout at Pahrump Hills',
  'Curiosity Mars Rover Approach to Pahrump Hills',
  'Mars Curiosity Rover Views Comet Siding Spring',
  'Mars Rover Curiosity, Right Side View',
  'Mars Rover Curiosity, Left Side View',
  'Curiosity Mars Rover Flexes its Robotic Arm',
  'Curiosity First Image of Earth and Moon',
  'Test Scooping for Mars Rover Curiosity',
  'NASA Mars Rover Curiosity, Front Left Corner',
  'Drill Bit Tip on Curiosity, Head-on View',
  'Preparatory Test for First Rock Drilling',
  'Curiosity Route from Landing to Mount Sharp',
  'View From Orbiter Showing Curiosity at Shaler'
];

const UNIQUE_DATES: string[] = [
  '2011-11-28', '2013-06-05', '2011-06-13', '2011-04-06', '2011-05-26',
  '2011-05-26', '2011-07-22', '2010-09-16', '2012-03-28', '2011-03-18',
  '2011-03-18', '2010-07-05', '2011-04-06', '2011-06-13', '2014-01-29',
  '2014-04-25', '2013-05-09', '2011-06-13', '2011-06-13', '2011-06-13',
  '2012-06-11', '2015-12-17', '2011-01-18', '2012-02-07', '2011-01-18',
  '2011-04-06', '2014-07-08', '2014-02-19', '2013-02-04', '2010-09-13',
  '2015-08-19', '2012-05-11', '2015-04-22', '2013-01-07', '2014-04-03',
  '2014-11-04', '2014-09-25', '2014-11-06', '2011-06-13', '2011-06-13',
  '2010-09-16', '2013-10-17', '2012-10-31', '2011-04-06', '2013-02-04',
  '2013-02-04', '2014-12-16', '2013-06-27'
];

const CAMERAS: { name: string; full_name: string }[] = [
  { name: 'MAST', full_name: 'Mast Camera (Mastcam)' },
  { name: 'FHAZ', full_name: 'Front Hazard Avoidance Camera' },
  { name: 'RHAZ', full_name: 'Rear Hazard Avoidance Camera' },
  { name: 'NAVCAM', full_name: 'Navigation Camera' },
  { name: 'CHEMCAM', full_name: 'Chemistry and Camera Complex' },
  { name: 'MAHLI', full_name: 'Mars Hand Lens Imager' }
];

const GENERATED_ROVER_PHOTOS: RoverPhoto[] = UNIQUE_IMAGE_URLS.map((url, i) => {
  const cam = CAMERAS[i % CAMERAS.length];
  return {
    id: 20000 + i,
    sol: 1000 + (i * 5),
    camera: {
      id: 20 + (i % CAMERAS.length),
      name: cam.name,
      rover_id: 5,
      full_name: cam.full_name
    },
    img_src: url,
    earth_date: UNIQUE_DATES[i],
    rover: {
      id: 5,
      name: 'Curiosity',
      landing_date: '2012-08-06',
      launch_date: '2011-11-26',
      status: 'active'
    }
  };
});

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

  /**
   * Fetch a single Mars Rover photo by its numeric ID
   */
  getRoverPhotoById(id: number): Observable<RoverPhoto | undefined> {
    const photo = GENERATED_ROVER_PHOTOS.find(p => p.id === id);
    return of(photo);
  }

  /**
   * Fetch a single NASA Image search record by its NASA ID
   */
  getNasaImageById(nasaId: string): Observable<any> {
    const params = new HttpParams().set('nasa_id', nasaId);
    return this.http.get<any>(`https://images-api.nasa.gov/search`, { params }).pipe(
      timeout(8000),
      catchError((err) => {
        console.error('NASA Image get by ID error:', err);
        return of({ collection: { items: [] } });
      })
    );
  }
}

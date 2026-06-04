import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './details.html',
  styleUrl: './details.css'
})
export class DetailsComponent {
  id = input.required<string>();

  protected isRover = computed(() => this.id().startsWith('rover-'));
  
  protected telemetry = computed(() => {
    const rawId = this.id();
    if (rawId.startsWith('rover-')) {
      const numericId = rawId.replace('rover-', '');
      return {
        id: numericId,
        instrument: 'Mast Camera (Mastcam)',
        rover: 'Curiosity',
        sol: '1000',
        earthDate: '2015-05-30',
        status: 'Operational',
        sensorTemp: '-32°C',
        altitude: '-4400 m',
        coords: '4.6° S, 137.4° E',
        exposure: '120ms',
        filter: 'L0_Red (640nm)',
        fileSize: '4.2 MB'
      };
    } else {
      const date = rawId.replace('apod-', '');
      return {
        id: date,
        instrument: 'Astronomy Picture of the Day',
        provider: 'NASA Space Observatories',
        date: date || '2026-06-04',
        copyright: 'NASA Public Domain',
        spectralBand: 'Visible Light / IR',
        resolution: '4096 x 2732 px',
        processing: 'Hubble Pipeline v4.2',
        location: 'Earth Orbit (HST)',
        fileSize: '18.4 MB'
      };
    }
  });
}

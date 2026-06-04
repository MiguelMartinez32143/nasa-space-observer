import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NasaService, ApodResponse } from './services/nasa.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private nasaService = inject(NasaService);

  protected loading = signal<boolean>(false);
  protected apiResult = signal<ApodResponse | null>(null);
  protected error = signal<string | null>(null);

  fetchNasaData() {
    this.loading.set(true);
    this.error.set(null);
    this.apiResult.set(null);

    console.log('Iniciando fetch a la API de la NASA...');

    this.nasaService.getApod().subscribe({
      next: (data) => {
        this.apiResult.set(data);
        this.loading.set(false);
        console.log('¡Fetching exitoso! Datos recibidos de la NASA:', data);
      },
      error: (err) => {
        this.error.set('No se pudo conectar con la API de la NASA.');
        this.loading.set(false);
        console.error('Error en el fetching de la NASA:', err);
      }
    });
  }
}

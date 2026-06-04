import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../components/card/card';

interface FavoriteItem {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  description: string;
  badgeText: string;
}

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css'
})
export class FavoritesComponent {
  protected favorites = signal<FavoriteItem[]>([
    {
      id: 'rover-10001',
      imageUrl: 'https://images-assets.nasa.gov/image/PIA19808/PIA19808~thumb.jpg',
      title: 'Mast Camera (Mastcam) Panoramic',
      subtitle: 'Curiosity • Sol 1000',
      description: 'Vista panorámica de las laderas del Monte Sharp capturada por la cámara Mastcam.',
      badgeText: 'MAST'
    }
  ]);

  protected removeFavorite(id: string) {
    this.favorites.update(favs => favs.filter(f => f.id !== id));
  }
}

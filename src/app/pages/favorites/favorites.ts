import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../components/card/card';
import { FavoritesService } from '../../services/favorites.service';
import { UiService } from '../../services/ui.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css'
})
export class FavoritesComponent {
  private favoritesService = inject(FavoritesService);
  private uiService = inject(UiService);

  protected favorites = this.favoritesService.getFavorites();

  protected removeFavorite(id: string) {
    this.favoritesService.removeFavorite(id);
    this.uiService.showToast('Eliminado de Favoritos', 'info');
  }
}

import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './card.html',
  styleUrl: './card.css'
})
export class CardComponent {
  id = input.required<string>();
  imageUrl = input<string>('');
  title = input<string>('');
  subtitle = input<string>('');
  description = input<string>('');
  badgeText = input<string>();
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header';
import { SidebarComponent } from './components/sidebar/sidebar';
import { DiagnosticsPanelComponent } from './components/diagnostics-panel/diagnostics-panel';
import { UiService } from './services/ui.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    DiagnosticsPanelComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected uiService = inject(UiService);
}

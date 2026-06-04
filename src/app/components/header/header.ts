import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../services/ui.service';
import { DiagnosticsService } from '../../services/diagnostics.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent {
  protected uiService = inject(UiService);
  private diagnosticsService = inject(DiagnosticsService);

  // Computed state of API logs
  protected logCount = computed(() => this.diagnosticsService.logs().length);
  protected hasError = computed(() => this.diagnosticsService.logs().some(log => log.status >= 400));
}

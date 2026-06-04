import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiService } from '../../services/ui.service';
import { DiagnosticsService } from '../../services/diagnostics.service';

@Component({
  selector: 'app-diagnostics-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagnostics-panel.html',
  styleUrl: './diagnostics-panel.css'
})
export class DiagnosticsPanelComponent {
  protected uiService = inject(UiService);
  protected diagnosticsService = inject(DiagnosticsService);
}

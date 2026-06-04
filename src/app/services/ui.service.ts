import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  sidebarOpen = signal<boolean>(true);
  diagnosticsOpen = signal<boolean>(false);

  toggleSidebar() {
    this.sidebarOpen.update(open => !open);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  toggleDiagnostics() {
    this.diagnosticsOpen.update(open => !open);
  }

  closeDiagnostics() {
    this.diagnosticsOpen.set(false);
  }
}

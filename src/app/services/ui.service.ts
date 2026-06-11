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

  toastMessage = signal<string>('');
  toastVisible = signal<boolean>(false);
  toastType = signal<'success' | 'info' | 'error'>('success');
  private toastTimeout: any;

  showToast(message: string, type: 'success' | 'info' | 'error' = 'success') {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      this.toastVisible.set(false);
    }, 3000);
  }
}

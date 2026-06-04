import { Injectable, signal } from '@angular/core';

export interface DiagnosticLog {
  timestamp: string;
  method: string;
  url: string;
  status: number;
  statusText: string;
  timeMs: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DiagnosticsService {
  private logList = signal<DiagnosticLog[]>([]);
  public readonly logs = this.logList.asReadonly();

  addLog(method: string, url: string, status: number, statusText: string, timeMs: number, message?: string) {
    const timeString = new Date().toLocaleTimeString();
    const newLog: DiagnosticLog = {
      timestamp: timeString,
      method,
      url: this.sanitizeUrl(url),
      status,
      statusText,
      timeMs,
      message
    };
    
    this.logList.update(logs => [newLog, ...logs].slice(0, 50)); // Keep last 50 logs
  }

  private sanitizeUrl(url: string): string {
    // Hide API key in logs for security
    try {
      const urlObj = new URL(url);
      if (urlObj.searchParams.has('api_key')) {
        urlObj.searchParams.set('api_key', '***REDACTED***');
      }
      return urlObj.pathname + urlObj.search;
    } catch {
      return url.replace(/api_key=[^&]+/, 'api_key=***REDACTED***');
    }
  }
}

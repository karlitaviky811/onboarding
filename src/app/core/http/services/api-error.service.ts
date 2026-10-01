import { Injectable, signal } from '@angular/core';

export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiErrorTracker {
  private readonly _lastError = signal<ApiError | null>(null);
  readonly lastError = this._lastError.asReadonly();

  setError(error: ApiError): void {
    this._lastError.set(error);
  }

  clearError(): void {
    this._lastError.set(null);
  }
}

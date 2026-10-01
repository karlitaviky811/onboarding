import { Injectable, computed, signal } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _currentUser = signal<User | null>(null);
  private readonly _token = signal<string | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);

  setAuth(user: User, token: string): void {
    this._currentUser.set(user);
    this._token.set(token);
  }

  clearAuth(): void {
    this._currentUser.set(null);
    this._token.set(null);
  }
}

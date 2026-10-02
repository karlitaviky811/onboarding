import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

function runGuard(): boolean | ReturnType<Router['createUrlTree']> {
  return TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
}

describe('authGuard', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('returns true when the user IS authenticated', () => {
    authService.setAuth({ id: '1', email: 'user@test.com', name: 'User', roles: [] }, 'valid-token');

    const result = runGuard();

    expect(result).toBe(true);
  });

  it('returns a UrlTree (redirect) when the user is NOT authenticated', () => {
    // Token is null by default — not authenticated

    const result = runGuard();

    // Must NOT be true — must be a UrlTree redirect
    expect(result).not.toBe(true);
    // UrlTree exposes a toString() with the path
    expect(result?.toString()).toContain('onboarding');
  });
});

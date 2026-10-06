import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

function runGuard(): ReturnType<typeof authGuard> {
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

  test('returns true when the user IS authenticated', () => {
    authService.setAuth({ id: '1', email: 'user@test.com', name: 'User', roles: [] }, 'valid-token');

    const result = runGuard();

    expect(result).toBe(true);
  });

  test('returns a UrlTree (redirect) when the user is NOT authenticated', () => {
    const result = runGuard();

    expect(result).not.toBe(true);

    expect(result?.toString()).toContain('onboarding');
  });
});

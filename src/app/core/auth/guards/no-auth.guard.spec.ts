import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { noAuthGuard } from './no-auth.guard';
import { AuthService } from '../services/auth.service';

function runGuard(): boolean | ReturnType<Router['createUrlTree']> {
  return TestBed.runInInjectionContext(() => noAuthGuard({} as never, {} as never));
}

describe('noAuthGuard', () => {
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('returns true when the user is NOT authenticated (allows access to guest-only routes)', () => {
    // Token is null by default — not authenticated

    const result = runGuard();

    expect(result).toBe(true);
  });

  it('returns a UrlTree (redirect to root) when the user IS authenticated', () => {
    authService.setAuth({ id: '1', email: 'user@test.com', name: 'User', roles: [] }, 'valid-token');

    const result = runGuard();

    // Must NOT be true — must be a UrlTree redirect
    expect(result).not.toBe(true);
    // noAuthGuard redirects authenticated users to '/'
    expect(result?.toString()).toBe('/');
  });
});

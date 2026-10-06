import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { noAuthGuard } from './no-auth.guard';
import { AuthService } from '../services/auth.service';

function runGuard(): ReturnType<typeof noAuthGuard> {
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

  test('returns true when the user is NOT authenticated (allows access to guest-only routes)', () => {
    const result = runGuard();

    expect(result).toBe(true);
  });

  test('returns a UrlTree (redirect to root) when the user IS authenticated', () => {
    authService.setAuth({ id: '1', email: 'user@test.com', name: 'User', roles: [] }, 'valid-token');

    const result = runGuard();

    expect(result).not.toBe(true);

    expect(result?.toString()).toBe('/');
  });
});

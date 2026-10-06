import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { readSignal } from '../../../../testing';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  test('starts unauthenticated with null user and token', () => {
    expect(readSignal(service.currentUser)).toBeNull();
    expect(readSignal(service.token)).toBeNull();
    expect(readSignal(service.isAuthenticated)).toBe(false);
  });

  test('setAuth() stores the user and token, making isAuthenticated true', () => {
    const user = { id: '1', email: 'test@test.com', name: 'Test User', roles: [] };
    service.setAuth(user, 'tok-abc');

    expect(readSignal(service.currentUser)).toEqual(user);
    expect(readSignal(service.token)).toBe('tok-abc');
    expect(readSignal(service.isAuthenticated)).toBe(true);
  });

  test('clearAuth() resets user and token back to null', () => {
    const user = { id: '2', email: 'another@test.com', name: 'Another', roles: [] };
    service.setAuth(user, 'tok-xyz');

    service.clearAuth();

    expect(readSignal(service.currentUser)).toBeNull();
    expect(readSignal(service.token)).toBeNull();
  });

  test('isAuthenticated returns false after clearAuth()', () => {
    service.setAuth({ id: '3', email: 'x@x.com', name: 'X', roles: [] }, 'some-token');
    service.clearAuth();

    expect(readSignal(service.isAuthenticated)).toBe(false);
  });

  test('setAuth() with a different user replaces the previous one', () => {
    const userA = { id: 'a', email: 'a@a.com', name: 'A', roles: [] };
    const userB = { id: 'b', email: 'b@b.com', name: 'B', roles: [] };

    service.setAuth(userA, 'tok-a');
    service.setAuth(userB, 'tok-b');

    expect(readSignal(service.currentUser)).toEqual(userB);
    expect(readSignal(service.token)).toBe('tok-b');
  });
});

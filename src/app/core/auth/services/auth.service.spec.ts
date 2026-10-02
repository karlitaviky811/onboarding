import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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

  it('starts unauthenticated with null user and token', () => {
    expect(readSignal(service.currentUser)).toBeNull();
    expect(readSignal(service.token)).toBeNull();
    expect(readSignal(service.isAuthenticated)).toBe(false);
  });

  it('setAuth() stores the user and token, making isAuthenticated true', () => {
    const user = { id: '1', email: 'test@test.com' };
    service.setAuth(user, 'tok-abc');

    expect(readSignal(service.currentUser)).toEqual(user);
    expect(readSignal(service.token)).toBe('tok-abc');
    expect(readSignal(service.isAuthenticated)).toBe(true);
  });

  it('clearAuth() resets user and token back to null', () => {
    const user = { id: '2', email: 'another@test.com' };
    service.setAuth(user, 'tok-xyz');

    service.clearAuth();

    expect(readSignal(service.currentUser)).toBeNull();
    expect(readSignal(service.token)).toBeNull();
  });

  it('isAuthenticated returns false after clearAuth()', () => {
    service.setAuth({ id: '3', email: 'x@x.com' }, 'some-token');
    service.clearAuth();

    expect(readSignal(service.isAuthenticated)).toBe(false);
  });

  it('setAuth() with a different user replaces the previous one', () => {
    const userA = { id: 'a', email: 'a@a.com' };
    const userB = { id: 'b', email: 'b@b.com' };

    service.setAuth(userA, 'tok-a');
    service.setAuth(userB, 'tok-b');

    expect(readSignal(service.currentUser)).toEqual(userB);
    expect(readSignal(service.token)).toBe('tok-b');
  });
});

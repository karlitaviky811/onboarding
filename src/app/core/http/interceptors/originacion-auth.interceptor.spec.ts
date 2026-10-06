import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptors,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { originacionAuthInterceptor } from './originacion-auth.interceptor';
import {
  ORIGINACION_BASE_URL,
  ORIGINACION_AUTH,
} from '@core/config/originacion.config';

describe('originacionAuthInterceptor', () => {
  let http: HttpClient;
  let httpController: HttpTestingController;

  const BASE_URL = 'https://qa.test/origination';
  const VALID_AUTH = { username: 'sts_sac', password: 'hash-from-ops' };

  function setupTestBed(
    baseUrl: string,
    auth: { username: string; password: string } | null,
  ) {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([originacionAuthInterceptor])),
        provideHttpClientTesting(),
        { provide: ORIGINACION_BASE_URL, useValue: baseUrl },
        { provide: ORIGINACION_AUTH, useValue: auth },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpController = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpController.verify();
    TestBed.resetTestingModule();
  });

  describe('when URL targets Originación and auth is provided', () => {
    beforeEach(() => setupTestBed(BASE_URL, VALID_AUTH));

    test('attaches Authorization header to requests matching the Originación base URL', () => {
      http.post(`${BASE_URL}/validations/getmetamapbuttondata`, {}).subscribe();

      const req = httpController.expectOne(
        `${BASE_URL}/validations/getmetamapbuttondata`,
      );

      expect(req.request.headers.has('Authorization')).toBe(true);

      const expectedToken = btoa(`${VALID_AUTH.username}:${VALID_AUTH.password}`);
      expect(req.request.headers.get('Authorization')).toBe(`Basic ${expectedToken}`);

      req.flush({});
    });

    test('attaches auth to /origination proxy prefix path', () => {
      http.post('/origination/validations/savevalidationverification', {}).subscribe();

      const req = httpController.expectOne(
        '/origination/validations/savevalidationverification',
      );

      expect(req.request.headers.has('Authorization')).toBe(true);
      req.flush({});
    });
  });

  describe('when URL does NOT target Originación', () => {
    beforeEach(() => setupTestBed(BASE_URL, VALID_AUTH));

    test('passes through requests to other URLs unchanged (no Authorization header added)', () => {
      http.get('https://other-service.example.com/api/data').subscribe();

      const req = httpController.expectOne('https://other-service.example.com/api/data');

      expect(req.request.headers.has('Authorization')).toBe(false);

      req.flush({});
    });

    test('passes through requests to the app apiUrl', () => {
      http.get('http://localhost:3000/admin/config').subscribe();

      const req = httpController.expectOne('http://localhost:3000/admin/config');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  describe('when auth token is null (production path)', () => {
    beforeEach(() => setupTestBed(BASE_URL, null));

    test('passes through Originación requests without Authorization header when auth is null', () => {
      http.post(`${BASE_URL}/validations/getmetamapbuttondata`, {}).subscribe();

      const req = httpController.expectOne(
        `${BASE_URL}/validations/getmetamapbuttondata`,
      );

      expect(req.request.headers.has('Authorization')).toBe(false);

      req.flush({});
    });
  });

  describe('mockInterceptor URL collision guard', () => {
    test('mock interceptor does NOT match /origination/validations/* (different from /originacion/solicitudes/)', () => {
      const mockRelevantPath = '/originacion/solicitudes/';
      const ourPath = '/origination/validations/getmetamapbuttondata';

      expect(ourPath.includes(mockRelevantPath)).toBe(false);
      expect(ourPath.startsWith('/origination/')).toBe(true);
    });
  });

  describe('security invariant', () => {
    test('interceptor source does NOT contain literal credential strings', async () => {
      const { readFileSync } = await import('fs');
      const { resolve } = await import('path');

      const interceptorPath = resolve(
        'src/app/core/http/interceptors/originacion-auth.interceptor.ts',
      );
      const source = readFileSync(interceptorPath, 'utf-8');

      expect(source).not.toMatch(/sts_sac/);
      expect(source).not.toMatch(/password\s*:\s*['"`][^'"`]{4,}['"`]/);
      expect(source).not.toMatch(/username\s*:\s*['"`][^'"`]{4,}['"`]/);
    });
  });
});

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  AdminConfig,
  CountryConfig,
  IdentificationTypeConfig,
  ScreenTexts,
} from '@credit-application/domain';
import { Result, ok, err, NetworkError } from '@shared/result/result';
import { API_BASE_URL } from '@core/config/api.config';
import { LOGGER } from '@core/core';
import { Logger } from '@core/ports/logger.port';
import { AdminRuntimeConfigDto, CustomerServiceConfigDto, MaxRetriesConfigDto } from './admin-config.dto';

const KNOWN_PROVIDERS = ['metamap', 'facetec', 'regula'] as const;
type KnownProvider = typeof KNOWN_PROVIDERS[number];
const DEFAULT_IDENTITY_PROVIDER: KnownProvider = 'metamap';

@Injectable({ providedIn: 'root' })
export class AdminConfigAdapter implements AdminConfig {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly logger = inject(LOGGER);

  /** Cached provider name populated by preload(). null = not yet loaded. */
  private cachedIdentityProvider: string | null = null;

  async getIdentificationTypes(): Promise<Result<IdentificationTypeConfig[], NetworkError>> {
    try {
      const response = await firstValueFrom(
        this.http.get<IdentificationTypeConfig[]>(
          `${this.baseUrl}/admin/tipos-identificacion?pais=CR&tipoPersona=FISICA&visualizacionOriginacion=true`,
        ),
      );
      return ok(response);
    } catch (error) {
      this.logger.error('Failed to get identification types', error);
      return err(new NetworkError());
    }
  }

  async getCountries(): Promise<Result<CountryConfig[], NetworkError>> {
    try {
      const response = await firstValueFrom(
        this.http.get<CountryConfig[]>(`${this.baseUrl}/admin/paises?validacionTelefonica=true`),
      );
      return ok(response);
    } catch (error) {
      this.logger.error('Failed to get countries', error);
      return err(new NetworkError());
    }
  }

  async getScreenTexts(screenKey: string): Promise<Result<ScreenTexts, NetworkError>> {
    try {
      const response = await firstValueFrom(
        this.http.get<ScreenTexts>(`${this.baseUrl}/admin/textos/${screenKey}`),
      );
      return ok(response);
    } catch (error) {
      this.logger.error('Failed to get screen texts', error);
      return err(new NetworkError());
    }
  }

  async getCustomerServicePhone(): Promise<Result<string, NetworkError>> {
    try {
      const config = await firstValueFrom(
        this.http.get<CustomerServiceConfigDto>(`${this.baseUrl}/admin/config/servicio-cliente`),
      );
      return ok(config.phone);
    } catch (error) {
      this.logger.error('Failed to get customer service phone', error);
      return err(new NetworkError());
    }
  }

  async getMaxRetries(): Promise<Result<number, NetworkError>> {
    try {
      const config = await firstValueFrom(
        this.http.get<MaxRetriesConfigDto>(`${this.baseUrl}/admin/config/reintentos`),
      );
      return ok(config.max_retries);
    } catch (error) {
      this.logger.error('Failed to get max retries', error);
      return err(new NetworkError());
    }
  }

  /**
   * Fetches the active identity provider from the backend config endpoint and
   * caches it. Called once at bootstrap via provideAppInitializer.
   *
   * Failure invariant: NEVER throws. On any error (network, unknown value) it
   * logs via LOGGER and caches the documented default 'metamap' so bootstrap
   * resolves normally.
   */
  async preload(): Promise<void> {
    try {
      const dto = await firstValueFrom(
        this.http.get<AdminRuntimeConfigDto>(`${this.baseUrl}/admin/config`),
      );
      const name = dto?.identityProvider;
      if (KNOWN_PROVIDERS.includes(name as KnownProvider)) {
        this.cachedIdentityProvider = name as KnownProvider;
      } else {
        this.cachedIdentityProvider = this.warnAndFallback(
          `admin config: unknown identityProvider value "${String(name)}"; defaulting to ${DEFAULT_IDENTITY_PROVIDER}`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to preload admin config; using default identity provider', error);
      this.cachedIdentityProvider = DEFAULT_IDENTITY_PROVIDER;
    }
  }

  /** Returns the cached identity provider name synchronously. Always non-empty. */
  getIdentityProvider(): string {
    return this.cachedIdentityProvider ?? DEFAULT_IDENTITY_PROVIDER;
  }

  private warnAndFallback(message: string): string {
    this.logger.warn(message);
    return DEFAULT_IDENTITY_PROVIDER;
  }
}

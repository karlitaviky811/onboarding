import { Result, NetworkError } from '@shared/result/result';

// Port for the Administrative System — CMS that configures texts, GIFs and catalogs

export interface IdentificationTypeConfig {
  id: string;
  label: string;
  mask: string;
  maxLength: number;
  isDefault: boolean;
}

export interface CountryConfig {
  code: string;
  name: string;
  phonePrefix: string;
  phoneMask: string;
  phoneMaxLength: number;
}

export interface ScreenTexts {
  title?: string;
  description?: string;
  gifUrl?: string;
  buttonLabel?: string;
}

export interface AdminConfig {
  getIdentificationTypes(): Promise<Result<IdentificationTypeConfig[], NetworkError>>;
  getCountries(): Promise<Result<CountryConfig[], NetworkError>>;
  getScreenTexts(screenKey: string): Promise<Result<ScreenTexts, NetworkError>>;
  getCustomerServicePhone(): Promise<Result<string, NetworkError>>;
  getMaxRetries(): Promise<Result<number, NetworkError>>;

  /**
   * Returns the configured identity provider identifier.
   * Synchronous — the adapter preloads this value during bootstrap.
   */
  getIdentityProvider(): string;
}

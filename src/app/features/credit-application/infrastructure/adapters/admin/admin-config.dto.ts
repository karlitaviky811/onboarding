export interface CustomerServiceConfigDto {
  phone: string;
}

export interface MaxRetriesConfigDto {
  max_retries: number;
}

export interface AdminRuntimeConfigDto {
  identityProvider?: string;
}

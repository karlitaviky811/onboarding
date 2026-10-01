import { Result, NetworkError } from '@shared/result/result';


export interface ScreenMedia {
  gifUrl: string;
  gifAlt: string;
}

export interface ScreenBranding {
  cardBackground: string;
  cardBackgroundImage?: string;
}

export interface ScreenCopy {
  headline: string;
  description: string;
  ctaLabel: string;
  legalNotice: string;
}

export interface ScreenContent {
  screenKey: string;
  copy: ScreenCopy;
  media: ScreenMedia;
  branding: ScreenBranding;
}

export interface ScreenContentRepository {
  load(screenKey: string): Promise<Result<ScreenContent, NetworkError>>;
}

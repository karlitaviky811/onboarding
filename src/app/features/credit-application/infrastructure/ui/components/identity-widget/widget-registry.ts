import { InjectionToken, Type } from '@angular/core';
import { MetamapWidgetComponent } from './metamap-widget/metamap-widget.component';
import { PersonaWidgetComponent } from './persona-widget/persona-widget.component';
import { OnfidoWidgetComponent } from './onfido-widget/onfido-widget.component';
import type { IdentityVerificationWidget } from './identity-verification-widget';

/**
 * Maps provider names (as returned by `AdminConfig.getIdentityProvider()`) to
 * their corresponding Angular component class.
 *
 * Each entry MUST implement {@link IdentityVerificationWidget}.
 *
 * To swap the active validator, change the `/admin/config` endpoint response
 * (or the mock interceptor in development) — the Consent screen is fully
 * provider-agnostic and reads this registry at runtime.
 *
 * Switchable values: 'metamap-widget' | 'persona-widget' | 'onfido-widget'
 *
 * Adding a new provider: add the entry here and implement IdentityVerificationWidget.
 */
export const IDENTITY_WIDGET_REGISTRY_MAP: Record<string, Type<IdentityVerificationWidget>> = {
  'metamap-widget': MetamapWidgetComponent as unknown as Type<IdentityVerificationWidget>,
  'persona-widget': PersonaWidgetComponent,
  'onfido-widget': OnfidoWidgetComponent,
};

/**
 * Injection token for the widget registry.
 * Provided at root via `provideIdentityWidgetRegistry()`.
 * Can be overridden in tests with a mock registry.
 */
export const IDENTITY_WIDGET_REGISTRY = new InjectionToken<
  Record<string, Type<IdentityVerificationWidget>>
>('IdentityWidgetRegistry', {
  providedIn: 'root',
  factory: () => IDENTITY_WIDGET_REGISTRY_MAP,
});

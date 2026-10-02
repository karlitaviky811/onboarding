import { describe, it, expect } from 'vitest';
import { IDENTITY_WIDGET_REGISTRY_MAP } from './widget-registry';
import { MetamapWidgetComponent } from './metamap-widget/metamap-widget.component';
import { PersonaWidgetComponent } from './persona-widget/persona-widget.component';
import { OnfidoWidgetComponent } from './onfido-widget/onfido-widget.component';

// ── Widget Registry tests ──────────────────────────────────────────────────────
//
// The registry map is the single source of truth for provider → component type.
// Tests verify it contains all three providers.

describe('IDENTITY_WIDGET_REGISTRY_MAP', () => {
  it('maps metamap-widget to MetamapWidgetComponent', () => {
    expect(IDENTITY_WIDGET_REGISTRY_MAP['metamap-widget']).toBe(MetamapWidgetComponent);
  });

  it('maps persona-widget to PersonaWidgetComponent', () => {
    expect(IDENTITY_WIDGET_REGISTRY_MAP['persona-widget']).toBe(PersonaWidgetComponent);
  });

  it('maps onfido-widget to OnfidoWidgetComponent', () => {
    expect(IDENTITY_WIDGET_REGISTRY_MAP['onfido-widget']).toBe(OnfidoWidgetComponent);
  });

  it('contains exactly three entries', () => {
    expect(Object.keys(IDENTITY_WIDGET_REGISTRY_MAP)).toHaveLength(3);
  });
});

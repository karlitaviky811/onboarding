import { describe, test, expect, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { IDENTITY_WIDGET_REGISTRY_MAP, IDENTITY_WIDGET_REGISTRY } from './widget-registry';
import { MetamapWidgetComponent } from './metamap-widget/metamap-widget.component';
import { PersonaWidgetComponent } from './persona-widget/persona-widget.component';
import { OnfidoWidgetComponent } from './onfido-widget/onfido-widget.component';

describe('IDENTITY_WIDGET_REGISTRY_MAP', () => {
  test('maps metamap-widget to MetamapWidgetComponent', () => {
    expect(IDENTITY_WIDGET_REGISTRY_MAP['metamap-widget']).toBe(MetamapWidgetComponent);
  });

  test('maps persona-widget to PersonaWidgetComponent', () => {
    expect(IDENTITY_WIDGET_REGISTRY_MAP['persona-widget']).toBe(PersonaWidgetComponent);
  });

  test('maps onfido-widget to OnfidoWidgetComponent', () => {
    expect(IDENTITY_WIDGET_REGISTRY_MAP['onfido-widget']).toBe(OnfidoWidgetComponent);
  });

  test('contains exactly three entries', () => {
    expect(Object.keys(IDENTITY_WIDGET_REGISTRY_MAP)).toHaveLength(3);
  });
});

describe('IDENTITY_WIDGET_REGISTRY injection token factory', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  test('factory returns the IDENTITY_WIDGET_REGISTRY_MAP when resolved from DI', () => {
    TestBed.configureTestingModule({});
    const registry = TestBed.inject(IDENTITY_WIDGET_REGISTRY);
    expect(registry).toBe(IDENTITY_WIDGET_REGISTRY_MAP);
  });
});

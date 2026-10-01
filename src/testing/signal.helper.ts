import { Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

/**
 * Reads a signal value inside a TestBed reactive context.
 * Angular signals must be read inside an injection context or a reactive
 * context; this helper ensures the call happens inside TestBed's zone so
 * that computed signals and effects resolve correctly in unit tests.
 */
export function readSignal<T>(sig: Signal<T>): T {
  return TestBed.runInInjectionContext(() => sig());
}

import { Type } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { render, RenderComponentOptions, RenderResult } from '@testing-library/angular';

/**
 * Typed wrapper around @testing-library/angular's render.
 * Pre-configures common Angular Material, Router, and HttpClient providers
 * so each test file does not have to repeat the boilerplate.
 */
export async function renderComponent<T>(
  component: Type<T>,
  options: RenderComponentOptions<T> = {},
): Promise<RenderResult<T>> {
  return render(component, {
    ...options,
    providers: [
      provideAnimationsAsync(),
      provideRouter([]),
      provideHttpClientTesting(),
      ...(options.providers ?? []),
    ],
  });
}

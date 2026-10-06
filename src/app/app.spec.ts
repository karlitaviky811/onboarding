import { describe, test, expect } from 'vitest';
import { screen } from '@testing-library/angular';
import { App } from './app';
import { renderComponent } from '../testing';

describe('App', () => {
  test('should render without errors', async () => {
    const { container } = await renderComponent(App);

    expect(container).toBeTruthy();
  });

  test('should contain a router-outlet', async () => {
    const { container } = await renderComponent(App);

    expect(container.querySelector('router-outlet')).toBeTruthy();
  });
});

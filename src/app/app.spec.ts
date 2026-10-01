import { screen } from '@testing-library/angular';
import { App } from './app';
import { renderComponent } from '../testing';

describe('App', () => {
  it('should render without errors', async () => {
    const { container } = await renderComponent(App);

    // The component mounted and its host element is in the rendered container
    expect(container).toBeTruthy();
  });

  it('should contain a router-outlet', async () => {
    const { container } = await renderComponent(App);

    expect(container.querySelector('router-outlet')).toBeTruthy();
  });
});

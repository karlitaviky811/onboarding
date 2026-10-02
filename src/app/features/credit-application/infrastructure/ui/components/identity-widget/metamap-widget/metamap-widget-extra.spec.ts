/**
 * MetamapWidgetComponent — extra branch coverage.
 *
 * Covers:
 * - retryLaunch() (line 219): clears error state and restarts the launch sequence
 * - polling success: SDK becomes ready after a few poll ticks (lines 197-202)
 * - identityId omitted branch in _executeLaunch (line 66 — the `{}` spread)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { renderComponent } from '../../../../../../../../testing';
import { MetamapWidgetComponent } from './metamap-widget.component';

interface FakeSdkInstance {
  start: ReturnType<typeof vi.fn>;
}

function makeFakeSdkClass() {
  const instances: FakeSdkInstance[] = [];
  const FakeSdk = vi.fn().mockImplementation(function (
    this: FakeSdkInstance,
    _cfg: unknown,
  ) {
    this.start = vi.fn();
    instances.push(this);
  }) as unknown as new (cfg: unknown) => FakeSdkInstance;
  (FakeSdk as unknown as { instances: FakeSdkInstance[] }).instances = instances;
  return FakeSdk;
}

function stubCustomElementsGet(present = true) {
  return vi.spyOn(customElements, 'get').mockReturnValue(
    present ? (class {} as unknown as CustomElementConstructor) : undefined,
  );
}

// ── retryLaunch() ─────────────────────────────────────────────────────────────

describe('MetamapWidgetComponent — retryLaunch()', () => {
  let FakeSdk: ReturnType<typeof makeFakeSdkClass>;
  let customElementsSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    FakeSdk = makeFakeSdkClass();
    vi.stubGlobal('MetamapVerification', FakeSdk);
    customElementsSpy = stubCustomElementsGet(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    customElementsSpy.mockRestore();
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('retryLaunch() resets loadFailed and loading then launches the SDK', async () => {
    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-retry', flowId: 'f-retry', autoLaunch: false },
    });
    const comp = fixture.componentInstance;

    // Simulate a previous load failure state
    comp.loadFailed.set(true);
    comp.loading.set(false);

    comp.retryLaunch();
    fixture.detectChanges();

    // Should have cleared load-failed state and launched
    expect(comp.loadFailed()).toBe(false);
    expect(FakeSdk).toHaveBeenCalledTimes(1);
  });

  it('retryLaunch() is a no-op when already launched (finished = true)', async () => {
    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1', autoLaunch: false },
    });
    const comp = fixture.componentInstance;

    // Mark as finished
    comp.finished.set(true);

    comp.retryLaunch();
    fixture.detectChanges();

    expect(FakeSdk).not.toHaveBeenCalled();
  });

  it('retryLaunch() is a no-op when already launched (_launched=true)', async () => {
    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1', autoLaunch: false },
    });
    const comp = fixture.componentInstance;

    // Manually trigger launch first
    comp.launchSdk();
    const sdkCallCount = (FakeSdk as unknown as { mock: { calls: unknown[][] } }).mock.calls.length;

    // retryLaunch should not trigger another launch
    comp.retryLaunch();
    expect((FakeSdk as unknown as { mock: { calls: unknown[][] } }).mock.calls.length).toBe(sdkCallCount);
  });
});

// ── Polling success path (SDK ready after poll tick) ─────────────────────────

describe('MetamapWidgetComponent — polling resolves when SDK becomes ready', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  it('launches the SDK when it becomes ready after a poll interval', async () => {
    vi.useFakeTimers();

    // SDK NOT ready initially
    vi.stubGlobal('MetamapVerification', undefined);
    const spy = vi.spyOn(customElements, 'get').mockReturnValue(undefined);

    const FakeSdk = makeFakeSdkClass();

    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-poll', flowId: 'f-poll', autoLaunch: true },
    });

    const comp = fixture.componentInstance;
    comp.pollIntervalMs = 100;
    comp.pollMaxAttempts = 10;

    // SDK is now ready: install before the next tick
    vi.stubGlobal('MetamapVerification', FakeSdk);
    spy.mockReturnValue(class {} as unknown as CustomElementConstructor);

    // Advance by one polling interval — sdkReady() will return true
    vi.advanceTimersByTime(150);
    fixture.detectChanges();

    expect(FakeSdk).toHaveBeenCalledTimes(1);

    spy.mockRestore();
  });

  it('clears polling and sets loadFailed when max attempts are exceeded', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('MetamapVerification', undefined);
    const spy = vi.spyOn(customElements, 'get').mockReturnValue(undefined);

    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1', autoLaunch: true },
    });

    // Exhaust all polling attempts
    vi.advanceTimersByTime(2500);
    fixture.detectChanges();

    expect(fixture.componentInstance.loadFailed()).toBe(true);

    spy.mockRestore();
  });
});

// ── events$ stream ─────────────────────────────────────────────────────────────

describe('MetamapWidgetComponent — events$ emits for finish and exit', () => {
  let FakeSdk: ReturnType<typeof makeFakeSdkClass>;
  let customElementsSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    FakeSdk = makeFakeSdkClass();
    vi.stubGlobal('MetamapVerification', FakeSdk);
    customElementsSpy = stubCustomElementsGet(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    customElementsSpy.mockRestore();
    TestBed.resetTestingModule();
  });

  it('events$ emits { type: "finished", verificationId } when SDK finishes', async () => {
    const events: Array<{ type: string; verificationId?: string }> = [];
    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1', autoLaunch: true },
    });
    fixture.componentInstance.events$.subscribe(e => events.push(e as { type: string; verificationId?: string }));

    window.dispatchEvent(
      new CustomEvent('metamap:userFinishedSdk', { detail: { verificationId: 'v-events-1' } }),
    );
    fixture.detectChanges();

    const finished = events.find(e => e.type === 'finished');
    expect(finished).toBeDefined();
    expect(finished?.verificationId).toBe('v-events-1');
  });

  it('events$ emits { type: "exited" } when user exits the SDK', async () => {
    const events: Array<{ type: string }> = [];
    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1', autoLaunch: true },
    });
    fixture.componentInstance.events$.subscribe(e => events.push(e));

    window.dispatchEvent(new CustomEvent('metamap:userExitedSdk'));
    fixture.detectChanges();

    expect(events).toContainEqual({ type: 'exited' });
  });

  it('events$ emits { type: "finished", verificationId: "ALREADY_VALIDATED" } on validated short-circuit', async () => {
    const events: Array<{ type: string; verificationId?: string }> = [];
    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1', validated: 0 },
    });
    fixture.componentInstance.events$.subscribe(e => events.push(e as { type: string; verificationId?: string }));

    fixture.componentRef.setInput('validated', 1);
    fixture.detectChanges();

    const finished = events.find(e => e.type === 'finished');
    expect(finished).toBeDefined();
    expect(finished?.verificationId).toBe('ALREADY_VALIDATED');
  });
});

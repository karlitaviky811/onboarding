
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
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


// ── Group 1 — Init / auto-launch config correctness ──────────────────────────

describe('MetamapWidgetComponent — 1. Init / auto-launch config correctness', () => {
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

  it('renders the host container element on init', async () => {
    await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1' },
    });

    expect(screen.getByTestId('metamap-widget-container')).toBeInTheDocument();
  });

  // ── SLICE 4 (auto-launch): SDK IS auto-launched on init when ready ──────────
  it('auto-launches the SDK on init when MetamapVerification and metamap-button are ready', async () => {
    await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1' },
    });

    expect(FakeSdk).toHaveBeenCalledTimes(1);
    const instances = (FakeSdk as unknown as { instances: FakeSdkInstance[] }).instances;
    expect(instances[0].start).toHaveBeenCalledTimes(1);
  });

  it('shows a loading state ("Abriendo verificación...") while waiting (SDK not ready yet)', async () => {
    // SDK not ready — polling will occur; loading state should be visible
    customElementsSpy.mockRestore();
    customElementsSpy = stubCustomElementsGet(false);
    vi.stubGlobal('MetamapVerification', undefined);

    await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1' },
    });

    expect(screen.getByTestId('metamap-widget-loading')).toBeInTheDocument();
  });
});

// ── Group 2 — Already-validated short-circuit ──────────────────────────────

describe('MetamapWidgetComponent — 2. Already-validated short-circuit', () => {
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

  it('emits sessionFinished with verificationId=ALREADY_VALIDATED when validated input becomes 1', async () => {
    const emitted: string[] = [];

    // Render without validated first so we can subscribe before the emission fires.
    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1', validated: 0 },
    });

    fixture.componentInstance.sessionFinished.subscribe((v: string) => emitted.push(v));

    // Now set validated=1 — ngOnChanges fires and should emit ALREADY_VALIDATED.
    fixture.componentRef.setInput('validated', 1);
    fixture.detectChanges();

    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toBe('ALREADY_VALIDATED');
  });

  it('does NOT show the launch button when validated=1', async () => {
    await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1', validated: 1 },
    });

    expect(
      screen.queryByRole('button', { name: /iniciar verificación/i }),
    ).not.toBeInTheDocument();
  });

  it('does NOT construct window.MetamapVerification when validated=1', async () => {
    await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1', validated: 1 },
    });

    expect(FakeSdk).not.toHaveBeenCalled();
  });

  // ── SLICE 4: no auto-launch when validated is truthy ──────────────────────
  it('does NOT auto-launch the SDK when validated is truthy on init', async () => {
    await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1', validated: 1 },
    });

    expect(FakeSdk).not.toHaveBeenCalled();
  });
});

// ── Group 3 — SDK launch args ──────────────────────────────────────────────

describe('MetamapWidgetComponent — 3. SDK launch args', () => {
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

  it('constructs MetamapVerification with clientId, flowId, language=es (no identityId when omitted)', async () => {
    // With auto-launch, the SDK is already constructed on init (no button click needed).
    await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'client-123', flowId: 'flow-456' },
    });

    expect(FakeSdk).toHaveBeenCalledTimes(1);
    const [cfg] = (FakeSdk as unknown as { mock: { calls: unknown[][] } }).mock.calls[0] as [Record<string, unknown>];
    expect(cfg['clientId']).toBe('client-123');
    expect(cfg['flowId']).toBe('flow-456');
    expect(cfg['language']).toBe('es');
    expect(cfg).not.toHaveProperty('identityId');
    expect(cfg).not.toHaveProperty('identificationNumber');
    expect(cfg).not.toHaveProperty('secretKey');
  });

  it('passes identityId when provided', async () => {
    await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1', identityId: 'id-789' },
    });

    const [cfg] = (FakeSdk as unknown as { mock: { calls: unknown[][] } }).mock.calls[0] as [Record<string, unknown>];
    expect(cfg['identityId']).toBe('id-789');
  });

  it('calls .start() on the SDK instance', async () => {
    await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1' },
    });

    const instances = (FakeSdk as unknown as { instances: FakeSdkInstance[] }).instances;
    expect(instances).toHaveLength(1);
    expect(instances[0].start).toHaveBeenCalledTimes(1);
  });
});

// ── Group 4 — Finish → sessionFinished emits verificationId ───────────────

describe('MetamapWidgetComponent — 4. Finish → sessionFinished emits verificationId', () => {
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

  it('emits verificationId via sessionFinished when metamap:userFinishedSdk fires', async () => {
    const finished: string[] = [];

    // Auto-launch: SDK launched on init, no button click required.
    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1' },
    });

    fixture.componentInstance.sessionFinished.subscribe((v: string) => finished.push(v));

    window.dispatchEvent(
      new CustomEvent('metamap:userFinishedSdk', { detail: { verificationId: 'v-001' } }),
    );
    fixture.detectChanges();

    expect(finished).toHaveLength(1);
    expect(finished[0]).toBe('v-001');
  });

  it('emits sessionExited when metamap:userExitedSdk fires', async () => {
    let exitedCount = 0;

    // Auto-launch: SDK launched on init.
    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1' },
    });

    fixture.componentInstance.sessionExited.subscribe(() => exitedCount++);

    window.dispatchEvent(new CustomEvent('metamap:userExitedSdk'));
    fixture.detectChanges();

    expect(exitedCount).toBe(1);
  });
});

// ── Group 5 — NgZone change-detection (signal update reflects in view) ─────

describe('MetamapWidgetComponent — 5. NgZone change-detection', () => {
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

  it('updates the view after the SDK finish event — finished signal reflects in DOM', async () => {
    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1' },
    });

    // Dispatch the event — component uses zone.run() so the `finished` signal update
    // is applied inside Angular's zone even though the event fires from outside.
    window.dispatchEvent(
      new CustomEvent('metamap:userFinishedSdk', { detail: { verificationId: 'v-cd-1' } }),
    );

    // Explicit detectChanges needed in zoneless test environment so the
    // OnPush component re-renders with the updated signal value.
    fixture.detectChanges();

    expect(screen.getByTestId('metamap-widget-finished')).toBeInTheDocument();
  });

  it('hides the launch button after the finish event (signal state = finished)', async () => {
    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1' },
    });

    window.dispatchEvent(
      new CustomEvent('metamap:userFinishedSdk', { detail: { verificationId: 'v-cd-2' } }),
    );

    fixture.detectChanges();

    expect(
      screen.queryByRole('button', { name: /iniciar verificación/i }),
    ).not.toBeInTheDocument();
  });
});

// ── Group 6 — SDK load failure → loadError, no throw ──────────────────────

describe('MetamapWidgetComponent — 6. SDK load failure → loadError, no throw', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  // ── SLICE 4: timeout-based loadError (polling never resolves) ────────────
  it('emits loadError after polling timeout when SDK never becomes ready', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('MetamapVerification', undefined);
    const spy = vi.spyOn(customElements, 'get').mockReturnValue(undefined);

    let errorCount = 0;

    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1' },
    });

    fixture.componentInstance.loadError.subscribe(() => errorCount++);

    // Advance past the full polling window: 15 attempts × 150 ms = 2250 ms
    vi.advanceTimersByTime(2500);
    fixture.detectChanges();

    expect(errorCount).toBe(1);
    spy.mockRestore();
  });

  it('does NOT throw when SDK is unavailable and polling times out — resolves gracefully', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('MetamapVerification', undefined);
    const spy = vi.spyOn(customElements, 'get').mockReturnValue(undefined);

    await expect(async () => {
      const { fixture } = await renderComponent(MetamapWidgetComponent, {
        componentInputs: { clientId: 'c-1', flowId: 'f-1' },
      });
      vi.advanceTimersByTime(2500);
      fixture.detectChanges();
    }).not.toThrow();

    spy.mockRestore();
  });

  it('does NOT construct MetamapVerification when the readiness guard never resolves', async () => {
    vi.useFakeTimers();
    const FakeSdk = makeFakeSdkClass();
    vi.stubGlobal('MetamapVerification', FakeSdk);
    const spy = vi.spyOn(customElements, 'get').mockReturnValue(undefined);

    await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1' },
    });

    vi.advanceTimersByTime(2500);

    expect(FakeSdk).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('shows retry button after load error — user can manually retry', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('MetamapVerification', undefined);
    const spy = vi.spyOn(customElements, 'get').mockReturnValue(undefined);

    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1' },
    });

    vi.advanceTimersByTime(2500);
    fixture.detectChanges();

    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    spy.mockRestore();
  });
});

// ── Group 7 — Listener cleanup on destroy ─────────────────────────────────

describe('MetamapWidgetComponent — 7. Listener cleanup on destroy', () => {
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

  it('removes the metamap:userFinishedSdk listener from window on ngOnDestroy', async () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1' },
    });

    // Auto-launch registers listeners on init; destroy must clean them up.
    fixture.destroy();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'metamap:userFinishedSdk',
      expect.any(Function),
    );

    removeEventListenerSpy.mockRestore();
  });

  it('removes the metamap:userExitedSdk listener from window on ngOnDestroy', async () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1' },
    });

    fixture.destroy();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'metamap:userExitedSdk',
      expect.any(Function),
    );

    removeEventListenerSpy.mockRestore();
  });

  it('does NOT emit sessionFinished after the component is destroyed', async () => {
    const finished: string[] = [];

    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1' },
    });

    fixture.componentInstance.sessionFinished.subscribe((v: string) => finished.push(v));

    fixture.destroy();

    // Dispatch AFTER destroy — listener should already be removed
    window.dispatchEvent(
      new CustomEvent('metamap:userFinishedSdk', { detail: { verificationId: 'v-ghost' } }),
    );

    expect(finished).toHaveLength(0);
  });

  // ── SLICE 4: polling timer cleared on destroy (no leak) ──────────────────
  it('clears the polling timer on ngOnDestroy — no timer leak', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('MetamapVerification', undefined);
    customElementsSpy.mockRestore();
    customElementsSpy = stubCustomElementsGet(false);

    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');

    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1' },
    });

    // Destroy before timeout — polling should stop
    fixture.destroy();

    expect(clearIntervalSpy).toHaveBeenCalled();

    vi.useRealTimers();
    clearIntervalSpy.mockRestore();
  });
});

// ── Group 9 — autoLaunch=false: on-demand launch via launchSdk() ──────────

describe('MetamapWidgetComponent — 9. autoLaunch=false: on-demand launch via launchSdk()', () => {
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

  it('does NOT launch SDK on init when autoLaunch=false', async () => {
    await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1', autoLaunch: false },
    });

    expect(FakeSdk).not.toHaveBeenCalled();
  });

  it('does NOT show loading state on init when autoLaunch=false', async () => {
    await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1', autoLaunch: false },
    });

    expect(screen.queryByTestId('metamap-widget-loading')).not.toBeInTheDocument();
  });

  it('launches SDK when launchSdk() is called manually (SDK already ready)', async () => {
    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'client-on-demand', flowId: 'flow-on-demand', autoLaunch: false },
    });

    // Not launched yet
    expect(FakeSdk).not.toHaveBeenCalled();

    // Parent triggers launch on demand
    fixture.componentInstance.launchSdk();

    expect(FakeSdk).toHaveBeenCalledTimes(1);
    const [cfg] = (FakeSdk as unknown as { mock: { calls: unknown[][] } }).mock.calls[0] as [Record<string, unknown>];
    expect(cfg['clientId']).toBe('client-on-demand');
    expect(cfg['flowId']).toBe('flow-on-demand');
    expect(cfg['language']).toBe('es');
  });

  it('calls .start() on the SDK instance after launchSdk()', async () => {
    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1', autoLaunch: false },
    });

    fixture.componentInstance.launchSdk();

    const instances = (FakeSdk as unknown as { instances: FakeSdkInstance[] }).instances;
    expect(instances).toHaveLength(1);
    expect(instances[0].start).toHaveBeenCalledTimes(1);
  });

  it('launchSdk() enters polling state when SDK not ready yet', async () => {
    vi.useFakeTimers();
    customElementsSpy.mockRestore();
    customElementsSpy = stubCustomElementsGet(false);
    vi.stubGlobal('MetamapVerification', undefined);

    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1', autoLaunch: false },
    });

    // Not loading before manual trigger
    expect(fixture.componentInstance.loading()).toBe(false);

    fixture.componentInstance.launchSdk();
    fixture.detectChanges();

    expect(screen.getByTestId('metamap-widget-loading')).toBeInTheDocument();
  });

  it('autoLaunch=true (default) still auto-launches — existing behavior unchanged', async () => {
    // Omitting autoLaunch → default true → SDK launches on init.
    await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1' },
    });

    expect(FakeSdk).toHaveBeenCalledTimes(1);
  });
});

// ── Group 10 — IdentityVerificationWidget interface ───────────────────────
// Tests for the new initialize()/open()/events$ contract added in Slice 6.

describe('MetamapWidgetComponent — 10. IdentityVerificationWidget interface', () => {
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

  it('initialize() does NOT launch the SDK (pre-warm only)', async () => {
    // Render with autoLaunch=false so ngAfterViewInit does not auto-launch
    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1', autoLaunch: false },
    });

    fixture.componentInstance.initialize({ referenceId: 'ref-001' });
    fixture.detectChanges();

    // initialize() alone must NOT construct the SDK
    expect(FakeSdk).not.toHaveBeenCalled();
  });

  it('open() launches the SDK (equivalent to launchSdk())', async () => {
    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1', autoLaunch: false },
    });

    fixture.componentInstance.open();

    // open() must trigger the SDK launch
    expect(FakeSdk).toHaveBeenCalledTimes(1);
    const instances = (FakeSdk as unknown as { instances: FakeSdkInstance[] }).instances;
    expect(instances[0].start).toHaveBeenCalledTimes(1);
  });

  it('events$ emits finished when metamap:userFinishedSdk fires', async () => {
    const events: Array<{ type: string; verificationId?: string }> = [];
    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1' },
    });

    fixture.componentInstance.events$.subscribe(e =>
      events.push(e as { type: string; verificationId?: string }),
    );

    window.dispatchEvent(
      new CustomEvent('metamap:userFinishedSdk', { detail: { verificationId: 'v-iface-001' } }),
    );
    fixture.detectChanges();

    const finishedEvent = events.find(e => e.type === 'finished');
    expect(finishedEvent).toBeDefined();
    expect(finishedEvent?.verificationId).toBe('v-iface-001');
  });

  it('events$ emits error when SDK polling times out', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('MetamapVerification', undefined);
    customElementsSpy.mockRestore();
    customElementsSpy = stubCustomElementsGet(false);

    const events: Array<{ type: string }> = [];
    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1' },
    });

    fixture.componentInstance.events$.subscribe(e => events.push(e));

    vi.advanceTimersByTime(2500);
    fixture.detectChanges();

    expect(events.some(e => e.type === 'error')).toBe(true);
  });

  it('already-validated short-circuit emits finished via events$', async () => {
    const events: Array<{ type: string; verificationId?: string }> = [];
    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1', validated: 0 },
    });

    fixture.componentInstance.events$.subscribe(e =>
      events.push(e as { type: string; verificationId?: string }),
    );

    fixture.componentRef.setInput('validated', 1);
    fixture.detectChanges();

    const finishedEvent = events.find(e => e.type === 'finished');
    expect(finishedEvent).toBeDefined();
    expect(finishedEvent?.verificationId).toBe('ALREADY_VALIDATED');
  });
});

// ── Group 8 — Auto-launch: no double-launch guard ─────────────────────────

describe('MetamapWidgetComponent — 8. Auto-launch: no double-launch guard', () => {
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

  it('only launches SDK once even if ngAfterViewInit is called multiple times', async () => {
    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1' },
    });

    // Simulate a second lifecycle call — should NOT double-launch
    fixture.componentInstance.ngAfterViewInit();
    fixture.detectChanges();

    expect(FakeSdk).toHaveBeenCalledTimes(1);
  });

  it('does not launch a second time if retry button is clicked after successful auto-launch', async () => {
    const user = userEvent.setup();

    const { fixture } = await renderComponent(MetamapWidgetComponent, {
      componentInputs: { clientId: 'c-1', flowId: 'f-1' },
    });

    // After successful auto-launch, no retry button should exist
    expect(
      screen.queryByRole('button', { name: /reintentar/i }),
    ).not.toBeInTheDocument();
    expect(FakeSdk).toHaveBeenCalledTimes(1);
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { renderComponent } from '../../../../../../../../testing';
import { OnfidoWidgetComponent } from './onfido-widget.component';

// ── Onfido SDK mock ────────────────────────────────────────────────────────────
//
// The 'onfido-sdk-ui' package is mocked entirely.
// The fake init() returns an instance with a tearDown spy.

interface FakeOnfidoHandle {
  tearDown: ReturnType<typeof vi.fn>;
  _onComplete?: (data: Record<string, unknown>) => void;
  _onError?: (error: { type: string; message: string }) => void;
  _onUserExit?: () => void;
}

const _handles: FakeOnfidoHandle[] = [];
let _lastInitOptions: Record<string, unknown> | null = null;

vi.mock('onfido-sdk-ui', () => {
  const fakeInit = vi.fn((options: Record<string, unknown>): FakeOnfidoHandle => {
    _lastInitOptions = options;
    const handle: FakeOnfidoHandle = {
      tearDown: vi.fn(),
      _onComplete: options['onComplete'] as ((data: Record<string, unknown>) => void) | undefined,
      _onError: options['onError'] as ((error: { type: string; message: string }) => void) | undefined,
      _onUserExit: options['onUserExit'] as (() => void) | undefined,
    };
    _handles.push(handle);
    return handle;
  });

  return {
    Onfido: { init: fakeInit },
    init: fakeInit,
  };
});

// Re-import to get the spy reference for assertions
import { Onfido } from 'onfido-sdk-ui';

function getLastHandle(): FakeOnfidoHandle {
  if (_handles.length === 0) throw new Error('No Onfido.init calls made');
  return _handles[_handles.length - 1];
}

describe('OnfidoWidgetComponent — 1. initialize() token validation', () => {
  beforeEach(() => {
    _handles.length = 0;
    _lastInitOptions = null;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('emits error event when onfidoToken is empty in environment', async () => {
    const events: Array<{ type: string; message?: string }> = [];
    const { fixture } = await renderComponent(OnfidoWidgetComponent);
    fixture.componentInstance.events$.subscribe(e => events.push(e as { type: string; message?: string }));

    // When no token is configured, initialize() must emit an error
    fixture.componentInstance.initialize({ referenceId: 'ref-no-token' });
    fixture.detectChanges();

    const errorEvent = events.find(e => e.type === 'error');
    expect(errorEvent).toBeDefined();
    expect(errorEvent?.message).toContain('token');
  });

  it('emits ready event when onfidoToken is present', async () => {
    const events: Array<{ type: string }> = [];
    const { fixture } = await renderComponent(OnfidoWidgetComponent);
    fixture.componentInstance.events$.subscribe(e => events.push(e));

    // Inject a token via the component's testToken input
    fixture.componentInstance['_testToken'] = 'sdk-test-token-123';
    fixture.componentInstance.initialize({ referenceId: 'ref-with-token' });
    fixture.detectChanges();

    expect(events).toContainEqual({ type: 'ready' });
  });

  it('does NOT call Onfido.init during initialize()', async () => {
    const { fixture } = await renderComponent(OnfidoWidgetComponent);

    fixture.componentInstance['_testToken'] = 'sdk-test-token-456';
    fixture.componentInstance.initialize({ referenceId: 'ref-prewarm' });
    fixture.detectChanges();

    // initialize() validates readiness — init is called in open()
    expect(_handles).toHaveLength(0);
  });
});

describe('OnfidoWidgetComponent — 2. open() calls Onfido.init', () => {
  beforeEach(() => {
    _handles.length = 0;
    _lastInitOptions = null;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('calls Onfido.init with token when open() is invoked after initialize()', async () => {
    const { fixture } = await renderComponent(OnfidoWidgetComponent);
    fixture.componentInstance['_testToken'] = 'sdk-open-token-789';
    fixture.componentInstance.initialize({ referenceId: 'ref-open' });
    fixture.componentInstance.open();
    fixture.detectChanges();

    expect(_handles).toHaveLength(1);
    expect(_lastInitOptions?.['token']).toBe('sdk-open-token-789');
  });

  it('passes steps array to Onfido.init', async () => {
    const { fixture } = await renderComponent(OnfidoWidgetComponent);
    fixture.componentInstance['_testToken'] = 'sdk-steps-token';
    fixture.componentInstance.initialize({ referenceId: 'ref-steps' });
    fixture.componentInstance.open();
    fixture.detectChanges();

    expect(Array.isArray(_lastInitOptions?.['steps'])).toBe(true);
    expect((_lastInitOptions?.['steps'] as string[]).length).toBeGreaterThan(0);
  });

  it('emits error and does NOT call Onfido.init when no token', async () => {
    const events: Array<{ type: string }> = [];
    const { fixture } = await renderComponent(OnfidoWidgetComponent);
    fixture.componentInstance.events$.subscribe(e => events.push(e));

    // No token set — open() without a token must emit error without calling init
    fixture.componentInstance.initialize({ referenceId: 'ref-no-token-open' });
    fixture.componentInstance.open();
    fixture.detectChanges();

    expect(_handles).toHaveLength(0);
    expect(events.some(e => e.type === 'error')).toBe(true);
  });
});

describe('OnfidoWidgetComponent — 3. onComplete callback → events$ finished', () => {
  beforeEach(() => {
    _handles.length = 0;
    _lastInitOptions = null;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('emits finished event when onComplete fires with applicantId', async () => {
    const events: Array<{ type: string; verificationId?: string }> = [];
    const { fixture } = await renderComponent(OnfidoWidgetComponent);
    fixture.componentInstance.events$.subscribe(e => events.push(e as { type: string; verificationId?: string }));

    fixture.componentInstance['_testToken'] = 'sdk-complete-token';
    fixture.componentInstance.initialize({ referenceId: 'ref-complete' });
    fixture.componentInstance.open();
    fixture.detectChanges();

    const handle = getLastHandle();
    handle._onComplete?.({ applicant_id: 'applicant-abc-123' });
    fixture.detectChanges();

    const finishedEvent = events.find(e => e.type === 'finished');
    expect(finishedEvent).toBeDefined();
    expect(finishedEvent?.verificationId).toBeTruthy();
  });

  it('falls back to referenceId when applicant_id is absent', async () => {
    const events: Array<{ type: string; verificationId?: string }> = [];
    const { fixture } = await renderComponent(OnfidoWidgetComponent);
    fixture.componentInstance.events$.subscribe(e => events.push(e as { type: string; verificationId?: string }));

    fixture.componentInstance['_testToken'] = 'sdk-fallback-token';
    fixture.componentInstance.initialize({ referenceId: 'fallback-ref-id' });
    fixture.componentInstance.open();
    fixture.detectChanges();

    const handle = getLastHandle();
    handle._onComplete?.({});
    fixture.detectChanges();

    const finishedEvent = events.find(e => e.type === 'finished');
    expect(finishedEvent).toBeDefined();
    expect(finishedEvent?.verificationId).toBe('fallback-ref-id');
  });
});

describe('OnfidoWidgetComponent — 4. onUserExit → events$ exited', () => {
  beforeEach(() => {
    _handles.length = 0;
    _lastInitOptions = null;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('emits exited event when onUserExit fires', async () => {
    const events: Array<{ type: string }> = [];
    const { fixture } = await renderComponent(OnfidoWidgetComponent);
    fixture.componentInstance.events$.subscribe(e => events.push(e));

    fixture.componentInstance['_testToken'] = 'sdk-exit-token';
    fixture.componentInstance.initialize({ referenceId: 'ref-exit' });
    fixture.componentInstance.open();
    fixture.detectChanges();

    const handle = getLastHandle();
    handle._onUserExit?.();
    fixture.detectChanges();

    expect(events).toContainEqual({ type: 'exited' });
  });
});

describe('OnfidoWidgetComponent — 5. onError → events$ error', () => {
  beforeEach(() => {
    _handles.length = 0;
    _lastInitOptions = null;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('emits error event with message when onError fires', async () => {
    const events: Array<{ type: string; message?: string }> = [];
    const { fixture } = await renderComponent(OnfidoWidgetComponent);
    fixture.componentInstance.events$.subscribe(e => events.push(e as { type: string; message?: string }));

    fixture.componentInstance['_testToken'] = 'sdk-error-token';
    fixture.componentInstance.initialize({ referenceId: 'ref-error' });
    fixture.componentInstance.open();
    fixture.detectChanges();

    const handle = getLastHandle();
    handle._onError?.({ type: 'expired_token', message: 'SDK token expired' });
    fixture.detectChanges();

    const errorEvent = events.find(e => e.type === 'error');
    expect(errorEvent).toBeDefined();
    expect(errorEvent?.message).toBe('SDK token expired');
  });
});

describe('OnfidoWidgetComponent — 6. destroy() calls tearDown', () => {
  beforeEach(() => {
    _handles.length = 0;
    _lastInitOptions = null;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('calls tearDown on the Onfido handle when destroy() is invoked', async () => {
    const { fixture } = await renderComponent(OnfidoWidgetComponent);
    fixture.componentInstance['_testToken'] = 'sdk-destroy-token';
    fixture.componentInstance.initialize({ referenceId: 'ref-destroy' });
    fixture.componentInstance.open();
    fixture.detectChanges();

    fixture.componentInstance.destroy();

    const handle = getLastHandle();
    expect(handle.tearDown).toHaveBeenCalledTimes(1);
  });

  it('does NOT throw when destroy() is called before open()', async () => {
    const { fixture } = await renderComponent(OnfidoWidgetComponent);

    await expect(() => {
      fixture.componentInstance.destroy();
    }).not.toThrow();
  });
});

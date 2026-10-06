import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { renderComponent } from '../../../../../../../../testing';
import { PersonaWidgetComponent } from './persona-widget.component';

interface FakePersonaClientInstance {
  open: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  cancel: ReturnType<typeof vi.fn>;

  _onReady?: () => void;
  _onComplete?: (payload: { inquiryId: string; status: string }) => void;
  _onCancel?: (payload: { inquiryId?: string }) => void;
  _onError?: (error: { message?: string }) => void;
}

const _clientInstances: FakePersonaClientInstance[] = [];

vi.mock('persona', () => {
  class FakeClient implements FakePersonaClientInstance {
    open = vi.fn();
    destroy = vi.fn();
    cancel = vi.fn();
    _onReady?: () => void;
    _onComplete?: (payload: { inquiryId: string; status: string }) => void;
    _onCancel?: (payload: { inquiryId?: string }) => void;
    _onError?: (error: { message?: string }) => void;

    constructor(options: {
      templateId?: string;
      environment?: string;
      referenceId?: string;
      onReady?: () => void;
      onComplete?: (payload: { inquiryId: string; status: string }) => void;
      onCancel?: (payload: { inquiryId?: string }) => void;
      onError?: (error: { message?: string }) => void;
    }) {
      this._onReady = options.onReady;
      this._onComplete = options.onComplete;
      this._onCancel = options.onCancel;
      this._onError = options.onError;
      _clientInstances.push(this);
    }
  }

  return {
    default: { Client: FakeClient },
    Client: FakeClient,
  };
});

function getLastInstance(): FakePersonaClientInstance {
  if (_clientInstances.length === 0) throw new Error('No Persona.Client instances created');
  return _clientInstances[_clientInstances.length - 1];
}

describe('PersonaWidgetComponent — 1. initialize() constructs Persona.Client', () => {
  beforeEach(() => {
    _clientInstances.length = 0;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  test('does NOT construct Persona.Client before initialize() is called', async () => {
    await renderComponent(PersonaWidgetComponent);

    expect(_clientInstances).toHaveLength(0);
  });

  test('constructs Persona.Client with templateId from environment on initialize()', async () => {
    const { fixture } = await renderComponent(PersonaWidgetComponent);

    fixture.componentInstance.initialize({ referenceId: 'ref-001' });
    fixture.detectChanges();

    expect(_clientInstances).toHaveLength(1);
  });

  test('passes referenceId to Persona.Client constructor', async () => {
    const { fixture } = await renderComponent(PersonaWidgetComponent);

    fixture.componentInstance.initialize({ referenceId: 'ref-abc' });

    expect(_clientInstances).toHaveLength(1);

    expect(typeof _clientInstances[0]._onReady).toBe('function');
  });

  test('emits ready event when Persona onReady callback fires', async () => {
    const events: Array<{ type: string }> = [];
    const { fixture } = await renderComponent(PersonaWidgetComponent);
    fixture.componentInstance.events$.subscribe(e => events.push(e));

    fixture.componentInstance.initialize({ referenceId: 'ref-002' });
    fixture.detectChanges();

    const client = getLastInstance();
    client._onReady?.();
    fixture.detectChanges();

    expect(events).toContainEqual({ type: 'ready' });
  });
});

describe('PersonaWidgetComponent — 2. open() delegates to client.open()', () => {
  beforeEach(() => {
    _clientInstances.length = 0;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  test('calls client.open() when open() is invoked after initialize()', async () => {
    const { fixture } = await renderComponent(PersonaWidgetComponent);

    fixture.componentInstance.initialize({ referenceId: 'ref-open-1' });
    fixture.componentInstance.open();

    const client = getLastInstance();
    expect(client.open).toHaveBeenCalledTimes(1);
  });

  test('does NOT throw when open() is called before initialize() (guard)', async () => {
    const { fixture } = await renderComponent(PersonaWidgetComponent);

    await expect(() => {
      fixture.componentInstance.open();
    }).not.toThrow();
  });
});

describe('PersonaWidgetComponent — 3. onComplete → events$ emits finished', () => {
  beforeEach(() => {
    _clientInstances.length = 0;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  test('emits finished event with inquiryId when onComplete fires', async () => {
    const events: Array<{ type: string; verificationId?: string }> = [];
    const { fixture } = await renderComponent(PersonaWidgetComponent);
    fixture.componentInstance.events$.subscribe(e => events.push(e as { type: string; verificationId?: string }));

    fixture.componentInstance.initialize({ referenceId: 'ref-003' });
    fixture.detectChanges();

    const client = getLastInstance();
    client._onComplete?.({ inquiryId: 'inq-xyz', status: 'completed' });
    fixture.detectChanges();

    const finishedEvent = events.find(e => e.type === 'finished');
    expect(finishedEvent).toBeDefined();
    expect(finishedEvent?.verificationId).toBe('inq-xyz');
  });

  test('emits exited event when onCancel fires', async () => {
    const events: Array<{ type: string }> = [];
    const { fixture } = await renderComponent(PersonaWidgetComponent);
    fixture.componentInstance.events$.subscribe(e => events.push(e));

    fixture.componentInstance.initialize({ referenceId: 'ref-004' });
    fixture.detectChanges();

    const client = getLastInstance();
    client._onCancel?.({ inquiryId: 'inq-cancel' });
    fixture.detectChanges();

    expect(events).toContainEqual({ type: 'exited' });
  });

  test('emits error event when onError fires', async () => {
    const events: Array<{ type: string; message?: string }> = [];
    const { fixture } = await renderComponent(PersonaWidgetComponent);
    fixture.componentInstance.events$.subscribe(e => events.push(e as { type: string; message?: string }));

    fixture.componentInstance.initialize({ referenceId: 'ref-005' });
    fixture.detectChanges();

    const client = getLastInstance();
    client._onError?.({ message: 'SDK init failed' });
    fixture.detectChanges();

    const errorEvent = events.find(e => e.type === 'error');
    expect(errorEvent).toBeDefined();
    expect(errorEvent?.message).toBe('SDK init failed');
  });
});

describe('PersonaWidgetComponent — 4. destroy() delegates to client.destroy()', () => {
  beforeEach(() => {
    _clientInstances.length = 0;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  test('calls client.destroy() when destroy() is invoked', async () => {
    const { fixture } = await renderComponent(PersonaWidgetComponent);

    fixture.componentInstance.initialize({ referenceId: 'ref-destroy' });
    fixture.componentInstance.destroy();

    const client = getLastInstance();
    expect(client.destroy).toHaveBeenCalledTimes(1);
  });

  test('does NOT throw when destroy() is called before initialize()', async () => {
    const { fixture } = await renderComponent(PersonaWidgetComponent);

    await expect(() => {
      fixture.componentInstance.destroy();
    }).not.toThrow();
  });
});

describe('PersonaWidgetComponent — 5. initialize() catch block when Persona.Client constructor throws', () => {
  let originalClient: unknown;

  beforeEach(() => {
    _clientInstances.length = 0;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  test('emits error event with the thrown error message when Persona.Client constructor throws', async () => {
    const personaModule = await import('persona');
    const originalClientCtor = (personaModule.default as { Client: unknown }).Client;

    (personaModule.default as { Client: unknown }).Client = class {
      constructor() {
        throw new Error('Persona SDK unavailable in this environment');
      }
    };

    const events: Array<{ type: string; message?: string }> = [];
    const { fixture } = await renderComponent(PersonaWidgetComponent);
    fixture.componentInstance.events$.subscribe(e => events.push(e as { type: string; message?: string }));

    fixture.componentInstance.initialize({ referenceId: 'ref-catch' });
    fixture.detectChanges();

    (personaModule.default as { Client: unknown }).Client = originalClientCtor;

    const errorEvent = events.find(e => e.type === 'error');
    expect(errorEvent).toBeDefined();
    expect(errorEvent?.message).toContain('Persona SDK');
  });

  test('uses the fallback message when a non-Error value is thrown', async () => {
    const personaModule = await import('persona');
    const originalClientCtor = (personaModule.default as { Client: unknown }).Client;

    (personaModule.default as { Client: unknown }).Client = class {
      constructor() {
        throw 'boom';
      }
    };

    const events: Array<{ type: string; message?: string }> = [];
    const { fixture } = await renderComponent(PersonaWidgetComponent);
    fixture.componentInstance.events$.subscribe(e => events.push(e as { type: string; message?: string }));

    fixture.componentInstance.initialize({ referenceId: 'ref-nonerror' });
    fixture.detectChanges();

    (personaModule.default as { Client: unknown }).Client = originalClientCtor;

    const errorEvent = events.find(e => e.type === 'error');
    expect(errorEvent).toBeDefined();
    expect(errorEvent?.message).toBe('Persona SDK initialization failed');
  });
});

import { describe, test, expect } from 'vitest';
import {
  mapButtonDataResponse,
  mapSaveVerificationResponse,
} from './originacion-validation.mapper';
import {
  GetMetamapButtonDataResponseDto,
  SaveValidationVerificationResponseDto,
} from './originacion-validation.dto';

describe('mapButtonDataResponse', () => {
  test('maps all fields from DTO to view model', () => {
    const dto: GetMetamapButtonDataResponseDto = {
      clientId: 'client-abc',
      workflowId: 'flow-xyz',
      identityId: 'identity-001',
      validated: 0,
    };

    const vm = mapButtonDataResponse(dto);

    expect(vm.clientId).toBe('client-abc');
    expect(vm.flowId).toBe('flow-xyz');
    expect(vm.identityId).toBe('identity-001');
    expect(vm.validated).toBe(0);
  });

  test('maps DTO without identityId (identityId is optional)', () => {
    const dto: GetMetamapButtonDataResponseDto = {
      clientId: 'client-abc',
      workflowId: 'flow-xyz',
      validated: 1,
    };

    const vm = mapButtonDataResponse(dto);

    expect(vm.clientId).toBe('client-abc');
    expect(vm.flowId).toBe('flow-xyz');
    expect(vm.identityId).toBeUndefined();
    expect(vm.validated).toBe(1);
  });

  test('maps validated=1 (already validated) correctly', () => {
    const dto: GetMetamapButtonDataResponseDto = {
      clientId: 'c',
      workflowId: 'w',
      validated: 1,
    };

    const vm = mapButtonDataResponse(dto);
    expect(vm.validated).toBe(1);
  });
});

describe('mapSaveVerificationResponse', () => {
  test('delegates to mapVerdict and returns a VerdictOutcome for verified status', () => {
    const dto: SaveValidationVerificationResponseDto = {
      status: 'verified',
      triesLeft: 1,
    };

    const outcome = mapSaveVerificationResponse(dto);

    expect(outcome.state).toBe('approved');
    expect(outcome.route).toBe('/request/result');
    expect(outcome.triesLeft).toBe(2);
  });

  test('delegates to mapVerdict for rejected status', () => {
    const dto: SaveValidationVerificationResponseDto = {
      status: 'rejected',
      triesLeft: 2,
    };

    const outcome = mapSaveVerificationResponse(dto);

    expect(outcome.state).toBe('rejected');
    expect(outcome.triesLeft).toBe(1);
  });

  test('delegates to mapVerdict for support status', () => {
    const dto: SaveValidationVerificationResponseDto = {
      status: 'support',
      triesLeft: 0,
    };

    const outcome = mapSaveVerificationResponse(dto);

    expect(outcome.state).toBe('manual_review');
    expect(outcome.triesLeft).toBe(3);
  });

  test('delegates to mapVerdict for identificationNoMatch', () => {
    const dto: SaveValidationVerificationResponseDto = {
      status: 'identificationNoMatch',
      triesLeft: 1,
    };

    const outcome = mapSaveVerificationResponse(dto);

    expect(outcome.state).toBe('rejected');
  });

  test('delegates to mapVerdict for limitReached', () => {
    const dto: SaveValidationVerificationResponseDto = {
      status: 'limitReached',
      triesLeft: 3,
    };

    const outcome = mapSaveVerificationResponse(dto);

    expect(outcome.state).toBe('failed');
    expect(outcome.triesLeft).toBe(0);
  });

  test('handles null triesLeft (not-applicable case)', () => {
    const dto: SaveValidationVerificationResponseDto = {
      status: 'verified',
      triesLeft: null as unknown as number,
    };

    const outcome = mapSaveVerificationResponse(dto);

    expect(outcome.state).toBe('approved');
    expect(outcome.triesLeft).toBeNull();
  });
});

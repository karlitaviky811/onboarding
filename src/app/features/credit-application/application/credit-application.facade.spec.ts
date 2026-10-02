import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CreditApplicationFacade } from './credit-application.facade';
import { CreditApplication } from '../domain/entities/credit-application';
import { Identification, IdentificationType } from '../domain/value-objects/identification';
import { UserType } from '../domain/value-objects/user-type';
import {
  CREDIT_APPLICATION_REPOSITORY,
  IDENTITY_VERIFICATION,
  ADMIN_CONFIG,
  TSE_QUERY,
} from '../infrastructure/providers/credit-application.providers';
import { readSignal } from '../../../../testing';

const identification = new Identification(IdentificationType.National, '123456789');

function makeApp(userType: UserType = UserType.NewClient) {
  return CreditApplication.create('app-1', identification).withUserType(userType);
}

describe('CreditApplicationFacade', () => {
  let facade: CreditApplicationFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CreditApplicationFacade,
        {
          provide: CREDIT_APPLICATION_REPOSITORY,
          useValue: { findByIdentification: vi.fn(), findById: vi.fn(), save: vi.fn() },
        },
        {
          provide: IDENTITY_VERIFICATION,
          useValue: { verify: vi.fn() },
        },
        {
          provide: ADMIN_CONFIG,
          useValue: { getIdentityProvider: vi.fn().mockReturnValue('metamap') },
        },
        {
          provide: TSE_QUERY,
          useValue: { findByIdentification: vi.fn() },
        },
      ],
    });
    facade = TestBed.inject(CreditApplicationFacade);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('starts with all signals in their initial state', () => {
    expect(readSignal(facade.application)).toBeNull();
    expect(readSignal(facade.isLoading)).toBe(false);
    expect(readSignal(facade.error)).toBeNull();
    expect(readSignal(facade.personName)).toBeNull();
    expect(readSignal(facade.isNewClient)).toBeDefined();
  });

  it('setApplication() stores the application and derives userType signals', () => {
    const app = makeApp(UserType.NewClient);
    facade.setApplication(app);

    expect(readSignal(facade.application)).toBe(app);
    expect(readSignal(facade.isNewClient)).toBe(true);
    expect(readSignal(facade.isExistingClient)).toBe(false);
    expect(readSignal(facade.isResuming)).toBe(false);
  });

  it('setApplication() with ClientWithCard makes isExistingClient true', () => {
    facade.setApplication(makeApp(UserType.ClientWithCard));

    expect(readSignal(facade.isExistingClient)).toBe(true);
    expect(readSignal(facade.isNewClient)).toBe(false);
  });

  it('setApplication() with ClientWithoutCard also makes isExistingClient true', () => {
    facade.setApplication(makeApp(UserType.ClientWithoutCard));

    expect(readSignal(facade.isExistingClient)).toBe(true);
  });

  it('setApplication() with Prospect makes isResuming true', () => {
    facade.setApplication(makeApp(UserType.Prospect));

    expect(readSignal(facade.isResuming)).toBe(true);
  });

  it('setPersonName() stores the person name', () => {
    const name = { firstName: 'Ana', lastName: 'García', fullName: 'Ana García' };
    facade.setPersonName(name);

    expect(readSignal(facade.personName)).toEqual(name);
  });

  it('setLoading() updates the isLoading signal', () => {
    facade.setLoading(true);
    expect(readSignal(facade.isLoading)).toBe(true);

    facade.setLoading(false);
    expect(readSignal(facade.isLoading)).toBe(false);
  });

  it('setError() stores the error message', () => {
    facade.setError('Something went wrong');
    expect(readSignal(facade.error)).toBe('Something went wrong');

    facade.setError(null);
    expect(readSignal(facade.error)).toBeNull();
  });

  it('incrementRetries() and getRetries() track validation retry count', () => {
    expect(facade.getRetries()).toBe(0);
    facade.incrementRetries();
    facade.incrementRetries();
    expect(facade.getRetries()).toBe(2);
  });

  it('reset() clears all state back to initial values', () => {
    const app = makeApp(UserType.NewClient);
    facade.setApplication(app);
    facade.setLoading(true);
    facade.setError('error');
    facade.setPersonName({ firstName: 'X', lastName: 'Y', fullName: 'X Y' });
    facade.incrementRetries();

    facade.reset();

    expect(readSignal(facade.application)).toBeNull();
    expect(readSignal(facade.isLoading)).toBe(false);
    expect(readSignal(facade.error)).toBeNull();
    expect(readSignal(facade.personName)).toBeNull();
    expect(facade.getRetries()).toBe(0);
  });
});

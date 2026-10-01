// Person Data — persists across applications
export interface ContactData {
  countryCode: string;
  phone: string;
  email: string;
}

export class ApplicantProfile {
  constructor(
    readonly identificationNumber: string,
    readonly identificationType: string,
    readonly firstName?: string,
    readonly lastName?: string,
    readonly contact?: ContactData,
    readonly validatedAt?: Date,
  ) {}

  hasValidatedIdentity(): boolean {
    return this.validatedAt !== undefined;
  }

  withContact(contact: ContactData): ApplicantProfile {
    return new ApplicantProfile(
      this.identificationNumber,
      this.identificationType,
      this.firstName,
      this.lastName,
      contact,
      this.validatedAt,
    );
  }

  withValidation(validatedAt: Date): ApplicantProfile {
    return new ApplicantProfile(
      this.identificationNumber,
      this.identificationType,
      this.firstName,
      this.lastName,
      this.contact,
      validatedAt,
    );
  }
}

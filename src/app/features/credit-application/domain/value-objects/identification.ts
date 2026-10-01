export enum IdentificationType {
  National = 'NACIONAL',
  DIMEX = 'DIMEX',
}

export class Identification {
  constructor(
    readonly type: IdentificationType,
    readonly number: string,
  ) {
    if (!number || number.trim().length === 0) {
      throw new Error('Identification number cannot be empty');
    }
  }

  equals(other: Identification): boolean {
    return this.type === other.type && this.number === other.number;
  }

  toString(): string {
    return `${this.type}:${this.number}`;
  }
}

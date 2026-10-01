export enum ApplicationStage {
  Intention = 'INTENCION',
  Request = 'SOLICITUD',
  IdentityValidation = 'VALIDACION_IDENTIDAD',
  CreditAnalysis = 'ANALISIS_CREDITO',
  Result = 'RESULTADO',
  KYC = 'KYC',
  Personalization = 'PERSONALIZACION',
  Activation = 'ACTIVACION',
  CardInsurance = 'SEGURO_TARJETA',
}

export enum ApplicationSubstage {
  // Request
  BasicData = 'DATOS_BASICOS',
  Consent = 'CONSENTIMIENTO',
  // IdentityValidation
  IdentityValidationStep = 'VALIDACION_IDENTIDAD',
  EmailValidation = 'VALIDACION_CORREO',
  PhoneValidation = 'VALIDACION_CELULAR',
  ContactValidation = 'VALIDACION_CONTACTO',
  FlipContact = 'CONTACTO_FLIP',
  // CreditAnalysis
  Qualification = 'TIPIFICACION',
  // Result
  Income = 'INGRESO',
  ResultStep = 'RESULTADO',
  Credentials = 'CREDENCIALES',
  DocumentDelivery = 'ENTREGA_DOCUMENTOS',
  // KYC
  PersonalData = 'DATOS_PERSONALES',
  Address = 'DOMICILIO',
  IncomeDetails = 'DETALLES_INGRESO',
  Employment = 'TRABAJO',
  // Personalization
  Card = 'TARJETA',
  Acceptance = 'ACEPTACION',
  Delivery = 'ENTREGA',
  Branch = 'SUCURSAL',
  Location = 'UBICACION',
  // Activation
  Completion = 'COMPLETADO',
  // Insurance
  InsuranceRequest = 'SOLICITUD_SEGURO',
  Acquisition = 'ADQUISICION',
}

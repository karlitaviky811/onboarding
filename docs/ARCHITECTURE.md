# Arquitectura del `onboarding-app`

> Documento de referencia para entender, explicar y extender la arquitectura.
> Fecha: 2026-09-30 · Feature principal: `credit-application`

---

## 1. TL;DR — El cuadro grande

La aplicación implementa **Arquitectura Hexagonal** (Ports & Adapters) organizada por **feature slices** (Screaming Architecture). Eso significa dos cosas en la práctica:

1. **La carpeta raíz "grita" el dominio**: ves `features/credit-application/` y ya sabes de qué trata el sistema, antes de leer una sola línea de código.
2. **El dominio no sabe que existe Angular**: las reglas de negocio viven en TypeScript puro, sin decoradores, sin `HttpClient`, sin signals. Angular llega recién en la capa de infraestructura.

```
┌────────────────────────────────────────────────────────┐
│                        UI / Angular                    │
│  (pages, components, signals, routes)                  │
│                     ↓ usa                              │
├────────────────────────────────────────────────────────┤
│               APPLICATION (Fachada + Casos de Uso)     │
│  Orquesta, conecta UI con dominio, posee los signals   │
│                     ↓ usa                              │
├────────────────────────────────────────────────────────┤
│                      DOMAIN                            │
│  Entidades · Value Objects · Puertos · Eventos         │
│  ← Nunca importa las capas de arriba                   │
└────────────────────────────────────────────────────────┘
         ↑ implementa                 ↑ implementa
┌──────────────────┐       ┌─────────────────────────────┐
│    Adapters HTTP │       │  Adapters KYC / Admin / TSE │
│  (infraestructura)       │  (infraestructura)          │
└──────────────────┘       └─────────────────────────────┘

  Dirección de dependencias: siempre hacia ADENTRO (al dominio).
  Los adapters conocen el dominio; el dominio NO conoce los adapters.
```

**Por qué esta arquitectura aquí:** una `CreditApplication` puede tener validación de identidad via MetaMap, FaceTec o Regula. Si el dominio dependiera de MetaMap directamente, cambiar de proveedor requeriría tocar reglas de negocio. Con hexagonal, el dominio solo conoce el puerto `KycProvider`; el adaptador que lo implementa se intercambia en la capa de infraestructura, sin tocar ni una línea del dominio.

---

## 2. Las 3 capas

### 2.1 Domain — La capa más protegida

**Responsabilidad:** modelar la realidad del negocio. Aquí vive TODO lo que es verdad independientemente de Angular, HTTP o cualquier framework.

**Regla de importaciones:** el domain solo puede importar de `@shared/result`. No puede importar `@angular/core`, `HttpClient`, ni nada de application o infrastructure.

| Concepto | Carpeta | Archivo real |
|---|---|---|
| Aggregate Root | `domain/entities/` | `credit-application.ts` |
| Entidad secundaria | `domain/entities/` | `applicant-profile.ts` |
| Value Object | `domain/value-objects/` | `identification.ts`, `consent.ts`, `user-type.ts`, `application-stage.ts` |
| Evento de dominio | `domain/events/` | `stage-advanced.event.ts` |
| Puerto (contrato) | `domain/ports/` | `identity-validator.port.ts`, `kyc-provider.port.ts`, etc. |
| Barrel público | `domain/` | `index.ts` |

**Ejemplo real — el Aggregate Root:**

```typescript
// src/app/features/credit-application/domain/entities/credit-application.ts

export class CreditApplication {
  private constructor(
    readonly id: string,
    readonly identification: Identification,
    readonly userType: UserType,
    readonly currentProgress: ApplicationProgress,
    // ...
  ) {}

  // Las mutaciones retornan una nueva instancia (inmutabilidad)
  advanceTo(stage: ApplicationStage, substage: ApplicationSubstage): CreditApplication {
    const newProgress = new ApplicationProgress(stage, substage, new Date());
    const event = new StageAdvancedEvent(this.id, stage, substage);
    return new CreditApplication(
      this.id, this.identification, this.userType,
      newProgress, this.profile, this.progressLog,
      [...this._events, event],
      this.result, this.createdAt,
    );
  }
}
```

**Ejemplo real — Value Object con validación:**

```typescript
// src/app/features/credit-application/domain/value-objects/identification.ts

export class Identification {
  constructor(readonly type: IdentificationType, readonly number: string) {
    if (!number || number.trim().length === 0) {
      throw new Error('Identification number cannot be empty');
    }
  }

  equals(other: Identification): boolean {
    return this.type === other.type && this.number === other.number;
  }
}
```

Los Value Objects no tienen identidad propia (no hay `id`); su igualdad se basa en sus atributos. Son la forma de darle nombre y comportamiento a datos primitivos.

---

### 2.2 Application — El director de orquesta

**Responsabilidad:** orquestar casos de uso y mantener el estado reactivo que la UI consume. Es la única capa que conoce tanto el dominio como Angular (signals, `@Injectable`).

**Regla de importaciones:** puede importar de `domain` y de `@angular/core`. No puede importar adapters concretos (solo tokens DI del barrel de infrastructure).

| Concepto | Carpeta | Archivo real |
|---|---|---|
| Fachada Angular | `application/` | `credit-application.facade.ts` |
| Caso de uso | `application/use-cases/` | `determine-user-type.use-case.ts`, `validate-identity.use-case.ts`, etc. |
| Barrel | `application/` | `index.ts` |

**Ejemplo real — fachada con signals:**

```typescript
// src/app/features/credit-application/application/credit-application.facade.ts

@Injectable()
export class CreditApplicationFacade {
  // Inyecta puertos via tokens, no adapters concretos
  private readonly repo      = inject(CREDIT_APPLICATION_REPOSITORY);
  private readonly validator = inject(IDENTITY_VALIDATOR);

  // Instancia los casos de uso pasándoles los puertos
  readonly validateIdentity = new ValidateIdentityUseCase(this.validator);

  // Los signals viven AQUÍ, no en el dominio
  private readonly _application = signal<CreditApplication | null>(null);
  readonly application = this._application.asReadonly();

  readonly isFlipClient = computed(() => this._userType() === UserType.FlipClient);
}
```

**Ejemplo real — caso de uso puro (sin Angular):**

```typescript
// src/app/features/credit-application/application/use-cases/determine-user-type.use-case.ts

export class DetermineUserTypeUseCase {
  constructor(private readonly repository: CreditApplicationRepository) {}

  async execute(identification: Identification): Promise<Result<{
    userType: UserType;
    existingApplication: CreditApplication | null;
  }, NotFoundError | NetworkError>> {
    const result = await this.repository.findByIdentification(identification);
    if (!result.success) return result;
    const existing = result.value;
    if (!existing) {
      return { success: true, value: { userType: UserType.NewClient, existingApplication: null } };
    }
    return { success: true, value: { userType: existing.userType, existingApplication: existing } };
  }
}
```

Nota clave: `DetermineUserTypeUseCase` no tiene `@Injectable`. Es TypeScript puro. Eso hace que sea trivialmente testeable con mocks manuales.

---

### 2.3 Infrastructure — La capa que toca el mundo real

**Responsabilidad:** implementar los puertos del dominio usando HTTP, SDKs, LocalStorage o cualquier tecnología concreta. También contiene las rutas y páginas de Angular.

**Regla de importaciones:** puede importar todo lo de arriba. No puede ser importada por domain ni application (salvo los tokens DI, que se exportan desde el barrel).

| Concepto | Carpeta | Archivo real |
|---|---|---|
| Adapter HTTP | `infrastructure/adapters/credix-core/` | `credix-core.adapter.ts` |
| Adapter identidad | `infrastructure/adapters/metamap/` | `metamap-identity.adapter.ts` |
| Adapter identidad (otro) | `infrastructure/adapters/identity/` | `http-identity-provider.adapter.ts` |
| Adapters KYC | `infrastructure/adapters/kyc/` | `metamap-kyc.adapter.ts`, `facetec-kyc.adapter.ts`, `regula-kyc.adapter.ts` |
| Tokens DI | `infrastructure/providers/` | `credit-application.providers.ts` |
| Páginas | `infrastructure/ui/pages/` | `identity-validation/`, `request/`, etc. |
| Rutas | `infrastructure/ui/` | `credit-application.routes.ts` |
| Barrel | `infrastructure/` | `index.ts` |

---

## 3. Puertos y Adapters — El corazón del sistema

### La analogía del enchufe

Imagina que tu dominio es un electrodoméstico con un **enchufe de 3 patas** (el puerto). No le importa si la pared tiene corriente de 110V de Costa Rica, 220V de Europa, o batería solar — mientras la **toma de corriente** (el adapter) tenga la forma correcta y entregue la función esperada.

- **Puerto** = la forma del enchufe = una interface TypeScript en `domain/ports/`
- **Adapter** = la toma de corriente = una clase en `infrastructure/adapters/` que implementa esa interface
- **InjectionToken** = el panel eléctrico = el punto de configuración que decide qué adapter enchufar

### Puerto real + su Adapter

```typescript
// PUERTO — domain/ports/identity-validator.port.ts
export interface IdentityValidator {
  validate(
    identificationNumber: string,
    flow: ValidationFlow,
  ): Promise<Result<IdentityValidationResult, NetworkError>>;

  validateContact(
    target: ValidationTarget,
    currentValue: string,
  ): Promise<Result<IdentityValidationResult, NetworkError>>;
}

// ADAPTER — infrastructure/adapters/metamap/metamap-identity.adapter.ts
@Injectable({ providedIn: 'root' })
export class MetaMapIdentityAdapter implements IdentityValidator {
  async validate(identificationNumber: string, flow: ValidationFlow) {
    try {
      const dto = await firstValueFrom(
        this.http.post<IdentityValidationResultDto>(
          `${this.baseUrl}/validacion/identidad`,
          { identificationNumber, flow },
        ),
      );
      return ok(mapDtoToIdentityValidationResult(dto));
    } catch (error) {
      this.logger.error('Failed to validate identity', error);
      return err(new NetworkError());
    }
  }
}
```

### Cómo se conectan: el archivo de providers

```typescript
// infrastructure/providers/credit-application.providers.ts

export const IDENTITY_VALIDATOR =
  new InjectionToken<IdentityValidator>('IdentityValidator');

export function provideCreditApplication(): EnvironmentProviders {
  return makeEnvironmentProviders([
    // useExisting: "cuando alguien pida IDENTITY_VALIDATOR, dale MetaMapIdentityAdapter"
    { provide: IDENTITY_VALIDATOR, useExisting: MetaMapIdentityAdapter },

    // useFactory: el KYC provider se resuelve en runtime según config del admin
    {
      provide: KYC_PROVIDER,
      useFactory: (adminConfig: AdminConfig, injector: Injector) => {
        const providerName = adminConfig.getKycProvider(); // "metamap" | "facetec" | "regula"
        switch (providerName) {
          case 'metamap': return injector.get(MetaMapKycAdapter);
          case 'facetec': return injector.get(FaceTecKycAdapter);
          case 'regula':  return injector.get(RegulaKycAdapter);
          default: throw new Error(`Unknown KYC provider: ${providerName}`);
        }
      },
      deps: [AdminConfigAdapter, Injector],
    },
  ]);
}
```

**Por qué `useExisting` y no `useClass`:** `useClass` crearía una segunda instancia del adapter. `useExisting` le dice a Angular "el singleton que ya existe en el árbol de DI para `MetaMapIdentityAdapter`, úsalo también para `IDENTITY_VALIDATOR`". Así no hay duplicado de estado.

**Por qué `useFactory` para KYC:** el proveedor de KYC puede cambiar entre metamap, facetec y regula según configuración del sistema administrador. La factory lee `adminConfig.getKycProvider()` y resuelve el adapter correcto desde el injector. El dominio solo ve `KycProvider`; no sabe cuál de los tres está activo.

---

## 4. Manejo de errores con `Result<T, E>`

### Por qué no `throw`

```typescript
// ❌ El problema con throw:
async function fetchUser(id: string): Promise<User> {
  // ¿Esta función puede fallar? ¿Con qué errores? No lo sé sin leer el cuerpo.
  // El compilador no me ayuda.
}

// ✅ Con Result:
async function fetchUser(id: string): Promise<Result<User, NetworkError>> {
  // El compilador OBLIGA a manejar el caso de error.
  // La firma dice exactamente qué puede salir mal.
}
```

`throw` torna los errores invisibles al compilador. `Result<T, E>` los vuelve parte del contrato de la función. No hay excepciones silenciosas que exploten en runtime.

### El tipo real

```typescript
// src/app/shared/result/result.ts

export type Result<T, E extends DomainError = DomainError> =
  | { readonly success: true;  readonly value: T }
  | { readonly success: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
  return { success: true, value };
}

export function err<E extends DomainError>(error: E): Result<never, E> {
  return { success: false, error };
}
```

### Cómo se usa en un adapter

```typescript
// infrastructure/adapters/credix-core/credix-core.adapter.ts

async findByIdentification(identification: Identification) {
  try {
    const response = await firstValueFrom(
      this.http.get<CreditApplicationResponseDto | null>(
        `${this.baseUrl}/originacion/solicitudes/${identification.number}`,
      ),
    );
    return ok(response ? mapDtoToCreditApplication(response) : null); // ← éxito
  } catch (error) {
    this.logger.error('Failed to find application by identification', error);
    return err(new NetworkError()); // ← fallo tipado
  }
}
```

### Cómo se ramifica en un caso de uso

```typescript
// application/use-cases/determine-user-type.use-case.ts

const result = await this.repository.findByIdentification(identification);

if (!result.success) {
  return result; // propaga el error sin ocultarlo
}

// A partir de aquí TypeScript sabe que result.value existe
const existing = result.value;
```

---

## 5. Flujo de punta a punta — Validación de identidad

Traza de la operación "el usuario hace clic en Verificar identidad":

```
IdentityValidation (página) → provider.createVerification() → HTTP → backend
```

### Paso a paso

**1. La página inyecta el token del puerto (no el adapter concreto):**

```typescript
// infrastructure/ui/pages/identity-validation/identity-validation/identity-validation.ts

export class IdentityValidation {
  private readonly facade    = inject(CreditApplicationFacade);
  private readonly provider  = inject<IdentityProvider>(IDENTITY_PROVIDER);
  //                                                     ^^^^^^^^^^^^^^^^
  //                                 Token DI — no sabe que detrás hay HttpIdentityProviderAdapter
}
```

**2. El usuario hace clic → `startVerification()` es invocado:**

```typescript
async startVerification(): Promise<void> {
  const application = this.facade.application(); // lee del signal de la fachada
  if (!application) { this.showMissingApplicationError(); return; }

  this.state.set('creating');
  const result = await this.provider.createVerification(application.id); // llama al puerto

  if (!result.success) {
    this.showNetworkError('No se pudo iniciar la verificación. Intente de nuevo.');
    return;
  }

  this.applyVerification(result.value);
  if (result.value.interactionUrl) {
    window.open(result.value.interactionUrl, '_blank', 'noopener,noreferrer');
  }
}
```

**3. Angular resuelve `IDENTITY_PROVIDER` → `HttpIdentityProviderAdapter.createVerification()`:**

```typescript
// infrastructure/adapters/identity/http-identity-provider.adapter.ts

async createVerification(applicationId: string): Promise<Result<IdentityVerification, NetworkError>> {
  try {
    const dto = await firstValueFrom(
      this.http.post<unknown>(`${this.baseUrl}/identity-verifications`, { applicationId }),
    );
    return ok(mapDtoToIdentityVerification(dto)); // mapea el DTO crudo al modelo de dominio
  } catch (error) {
    this.logger.error('Failed to create identity verification', error);
    return err(new NetworkError());
  }
}
```

**4. El HTTP real sale con `authInterceptor` que agrega el Bearer token:**

```typescript
// core/http/interceptors/auth.interceptor.ts

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
```

**5. El resultado vuelve por la cadena y la página actualiza su signal `state`:**

```typescript
private applyVerification(verification: IdentityVerification): void {
  this.verification.set(verification);
  this.state.set(verification.status); // 'pending' | 'approved' | 'rejected' | ...
  if (verification.status === 'approved') {
    void this.router.navigate(['/request/result']);
  }
}
```

**Resumen del flujo de archivos:**

```
identity-validation.ts          → inject(IDENTITY_PROVIDER)
  └── IDENTITY_PROVIDER token   → resuelto en credit-application.providers.ts
        └── HttpIdentityProviderAdapter.createVerification()
              └── POST /identity-verifications  (HTTP + authInterceptor)
                    └── mapDtoToIdentityVerification()
                          └── Result<IdentityVerification, NetworkError> → señal de estado en la página
```

---

## 6. Recetas de extensión

### 6a. Cómo agrego un nuevo proveedor de identidad (KYC)

> Ejemplo: agregar `Sumsub` como cuarta opción de KYC.

**1. Crear el adapter en `infrastructure/adapters/kyc/`:**

```typescript
// infrastructure/adapters/kyc/sumsub-kyc.adapter.ts

@Injectable({ providedIn: 'root' })
export class SumsubKycAdapter implements KycProvider {
  readonly name = 'Sumsub';

  private readonly _events = new Subject<KycEvent>();
  readonly events$: Observable<KycEvent> = this._events.asObservable();

  async initializeSession(params: {
    identificationNumber: string;
    identificationType: string;
    flow: 'document_selfie' | 'selfie_only' | 'document_only';
  }): Promise<Result<KycSessionConfig, DomainError>> {
    // Llama al backend para crear sesión Sumsub
    // Retorna ok(config) o err(new NetworkError())
    throw new Error('TODO: implement');
  }

  render(container: HTMLElement, config: KycSessionConfig): void {
    // Monta el SDK de Sumsub en el container
  }

  destroy(): void {
    // Limpia el SDK
  }
}
```

**2. Registrar en la factory de `credit-application.providers.ts`:**

```typescript
import { SumsubKycAdapter } from '../adapters/kyc/sumsub-kyc.adapter';

// En la factory del KYC_PROVIDER:
case 'sumsub': return injector.get(SumsubKycAdapter);
```

**3. (Cuando el backend soporte configurarlo) actualizar `AdminConfigAdapter.getKycProvider()`:**

```typescript
// Ya carga desde /admin/config/kyc-provider — solo asegurarse de que el backend devuelva 'sumsub'
```

**Archivos tocados:** `sumsub-kyc.adapter.ts` (nuevo) + `credit-application.providers.ts` (1 línea).
**Dominio: intacto.**

---

### 6b. Cómo agrego un nuevo caso de uso

> Ejemplo: `CalculateLoanCapacityUseCase`.

**1. Crear el archivo en `application/use-cases/`:**

```typescript
// application/use-cases/calculate-loan-capacity.use-case.ts

import { CreditApplication } from '@credit-application/domain';
import { CreditBureau, CreditScore } from '@credit-application/domain';
import { Result, NetworkError } from '@shared/result/result';

export class CalculateLoanCapacityUseCase {
  constructor(private readonly creditBureau: CreditBureau) {}

  async execute(application: CreditApplication): Promise<Result<CreditScore, NetworkError>> {
    return this.creditBureau.query(application.identification.number);
  }
}
```

**2. Instanciarlo en la fachada:**

```typescript
// application/credit-application.facade.ts

private readonly creditBureau = inject(CREDIT_BUREAU); // token existente o nuevo

readonly calculateLoanCapacity = new CalculateLoanCapacityUseCase(this.creditBureau);
```

**3. Exportar desde el barrel de application:**

```typescript
// application/index.ts
export { CalculateLoanCapacityUseCase } from './use-cases/calculate-loan-capacity.use-case';
```

**Archivos tocados:** `calculate-loan-capacity.use-case.ts` (nuevo) + `credit-application.facade.ts` (2 líneas) + `index.ts` (1 línea).

---

### 6c. Cómo agrego un nuevo puerto / integración externa

> Ejemplo: integrar un servicio de firma digital `ElectronicSignature`.

**1. Definir el puerto en `domain/ports/`:**

```typescript
// domain/ports/electronic-signature.port.ts

import { Result, NetworkError } from '@shared/result/result';

export interface SignatureRequest {
  documentId: string;
  signerIdentification: string;
}

export interface SignatureResult {
  signatureId: string;
  signedAt: Date;
  documentUrl: string;
}

export interface ElectronicSignature {
  requestSignature(req: SignatureRequest): Promise<Result<SignatureResult, NetworkError>>;
  getStatus(signatureId: string): Promise<Result<SignatureResult, NetworkError>>;
}
```

**2. Exportar desde el barrel de domain (`domain/index.ts`):**

```typescript
export type { ElectronicSignature, SignatureRequest, SignatureResult } from './ports/electronic-signature.port';
```

**3. Crear el adapter en `infrastructure/adapters/`:**

```typescript
// infrastructure/adapters/docusign/docusign-signature.adapter.ts

@Injectable({ providedIn: 'root' })
export class DocusignSignatureAdapter implements ElectronicSignature {
  async requestSignature(req: SignatureRequest): Promise<Result<SignatureResult, NetworkError>> {
    // HTTP al backend que integra con DocuSign
  }
  async getStatus(signatureId: string): Promise<Result<SignatureResult, NetworkError>> {
    // HTTP al backend
  }
}
```

**4. Crear el token y registrar el provider:**

```typescript
// infrastructure/providers/credit-application.providers.ts

export const ELECTRONIC_SIGNATURE =
  new InjectionToken<ElectronicSignature>('ElectronicSignature');

// En makeEnvironmentProviders:
{ provide: ELECTRONIC_SIGNATURE, useExisting: DocusignSignatureAdapter },
```

**5. Exportar el token desde el barrel de infrastructure (`infrastructure/index.ts`):**

```typescript
export { ELECTRONIC_SIGNATURE } from './providers/credit-application.providers';
```

**Archivos tocados:** `electronic-signature.port.ts` (nuevo) + `domain/index.ts` (1 export) + `docusign-signature.adapter.ts` (nuevo) + `credit-application.providers.ts` (token + provider) + `infrastructure/index.ts` (1 export).

---

### 6d. Cómo agrego un Value Object o Entidad al dominio

**Value Object** (sin identidad, igualdad por valor):

```typescript
// domain/value-objects/loan-amount.ts

import { Result, ok, err, ValidationError } from '@shared/result/result';

export class LoanAmount {
  private constructor(readonly value: number, readonly currency: string) {}

  static create(value: number, currency: string): Result<LoanAmount, ValidationError> {
    if (value <= 0) return err(new ValidationError('Loan amount must be positive'));
    if (!['CRC', 'USD'].includes(currency)) return err(new ValidationError('Unsupported currency'));
    return ok(new LoanAmount(value, currency));
  }

  equals(other: LoanAmount): boolean {
    return this.value === other.value && this.currency === other.currency;
  }
}
```

**Entidad** (con identidad, mutable via nuevas instancias):

```typescript
// domain/entities/loan-offer.ts

export class LoanOffer {
  constructor(
    readonly id: string,
    readonly applicationId: string,
    readonly amount: LoanAmount,
    readonly interestRate: number,
    readonly termMonths: number,
  ) {}

  withAcceptance(): LoanOffer {
    // Retorna nueva instancia con marca de aceptación
    return new LoanOffer(this.id, this.applicationId, this.amount, this.interestRate, this.termMonths);
  }
}
```

**Siempre exportar desde `domain/index.ts`:**

```typescript
export { LoanAmount } from './value-objects/loan-amount';
export { LoanOffer } from './entities/loan-offer';
```

---

## 7. Convenciones del proyecto

### Path aliases (tsconfig.json)

| Alias | Apunta a |
|---|---|
| `@credit-application/domain` | `src/app/features/credit-application/domain/index.ts` |
| `@credit-application/application` | `src/app/features/credit-application/application/index.ts` |
| `@credit-application/infrastructure` | `src/app/features/credit-application/infrastructure/index.ts` |
| `@shared/*` | `src/app/shared/*` |
| `@core/*` | `src/app/core/*` |

Usar siempre el alias en lugar de rutas relativas largas. Un import de dominio en un caso de uso debe verse así:

```typescript
import { CreditApplication } from '@credit-application/domain';
// NO: import { CreditApplication } from '../../domain/entities/credit-application';
```

### Barrels (index.ts por capa)

Cada capa expone un único `index.ts` que controla qué es público. Las capas de arriba solo importan desde ese barrel, nunca desde archivos internos directamente. Esto es lo que hace que el alias `@credit-application/domain` funcione.

### Convenciones de nombres

| Concepto | Sufijo | Ejemplo |
|---|---|---|
| Puerto | `.port.ts` | `identity-validator.port.ts` |
| Adapter | `.adapter.ts` | `metamap-identity.adapter.ts` |
| Caso de uso | `.use-case.ts` | `validate-identity.use-case.ts` |
| DTO (estructura de red) | `.dto.ts` | `credit-application.dto.ts` |
| Mapper (DTO → Dominio) | `.mapper.ts` | `credit-application.mapper.ts` |
| Spec de test | `.spec.ts` | `validate-identity.use-case.spec.ts` |

### Signals: solo en la fachada

Los signals de Angular (`signal()`, `computed()`) existen **únicamente** en `CreditApplicationFacade`. El dominio y los casos de uso son TypeScript puro — sin `signal`, sin `Observable`, sin `BehaviorSubject`. Los casos de uso devuelven `Promise<Result<T,E>>`; la fachada lee ese resultado y actualiza los signals.

### Testing

- Framework: **Vitest** (`npm test`)
- Archivos de test: colocados junto al archivo que testean (`*.spec.ts`)
- Los casos de uso del dominio se testean con mocks manuales (no `TestBed`):

```typescript
const repo: CreditApplicationRepository = {
  findByIdentification: vi.fn().mockResolvedValue(ok(null)),
  save: vi.fn(),
  findById: vi.fn(),
};
const useCase = new DetermineUserTypeUseCase(repo);
```

Esta es la evidencia de que el dominio es puro: se puede instanciar un caso de uso en un test sin importar nada de Angular.

---

## 8. Deuda técnica conocida / en progreso

### El problema: tres puertos para una sola capacidad de negocio

Actualmente existen **tres puertos en `domain/ports/`** que modelan variantes de la misma capacidad — validar la identidad de un solicitante:

| Puerto | Archivo | Qué hace |
|---|---|---|
| `IdentityValidator` | `identity-validator.port.ts` | Validación síncrona via POST a `/validacion/identidad` |
| `IdentityProvider` | `identity-provider.port.ts` | Creación/consulta de verificaciones asíncronas (webhook-driven) |
| `KycProvider` | `kyc-provider.port.ts` | Sesión KYC completa con SDK de terceros (MetaMap/FaceTec/Regula) |

Los tres puertos existen porque evolucionaron en ciclos separados de desarrollo. En la práctica representan la misma capacidad con distintos modelos de interacción.

**Efecto secundario visible:** MetaMap está implementado dos veces: como `MetaMapIdentityAdapter` (implementa `IdentityValidator`) y como `MetaMapKycAdapter` (implementa `KycProvider`). Ambos llaman al mismo endpoint `/validacion/identidad`.

### Lo que está en curso

Existe un SDD change activo llamado `unify-identity-verification-port` que propone colapsar los tres puertos en uno solo — `IdentityVerificationPort` — con selección de proveedor dirigida por configuración remota (`AdminConfig.getKycProvider()`). El trabajo incluye también el preload de la configuración de proveedor en bootstrap para que `getKycProvider()` sea síncrono y confiable.

Mientras ese refactor no esté completo, **no agregar código nuevo que dependa de `IdentityValidator` o `IdentityProvider` directamente**; en su lugar esperar la resolución del port unificado o consultar antes de extender esa área.

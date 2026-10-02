import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LibButtonComponent, LibChipComponent, LibTextFieldComponent, LibSelectFieldComponent } from 'crdx-components';
import { CreditApplicationFacade } from '@credit-application/application';
import {
  CreditApplication,
  Identification,
  IdentificationTypeConfig,
  IdentificationType,
  ScreenContent,
} from '@credit-application/domain';
import { AdminConfigAdapter } from '../../../../adapters/admin/admin-config.adapter';
import { ScreenContentAdapter } from '../../../../adapters/screen-content/screen-content.adapter';

interface ContactData {
  countryCode: string;
  phone: string;
  email: string;
}

interface CountryOption {
  value: string;
  label: string;
}

/**
 * Stage: Request — Substage: BasicData
 *
 * Shows: ID type toggle, ID number field with dynamic mask,
 * contact fields (country, phone, email) after valid ID is entered,
 * legal notice.
 *
 * Rules:
 *   - ID type selection drives mask, placeholder and max length.
 *   - Changing ID type clears the number field and hides contact fields.
 *   - When ID reaches exact length, field shows loading spinner for 1.5s
 *     (simulating Core API call), then contact fields appear.
 *   - Blur validates exact length; error shown if incomplete.
 *   - Continue enabled only when ID + all contact fields are valid.
 */
@Component({
  selector: 'app-basic-data',
  imports: [LibButtonComponent, LibChipComponent, LibTextFieldComponent, LibSelectFieldComponent],
  templateUrl: './basic-data.html',
  styleUrl: './basic-data.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicData {
  protected readonly facade = inject(CreditApplicationFacade);
  private readonly router = inject(Router);
  private readonly adminConfig = inject(AdminConfigAdapter);
  private readonly screenContentAdapter = inject(ScreenContentAdapter);

  /** Default identification types shown immediately while real data loads. */
  private static readonly DEFAULT_ID_TYPES: IdentificationTypeConfig[] = [
    { id: 'NACIONAL', label: 'Nacional', mask: '#-####-####', maxLength: 9, isDefault: true },
    { id: 'DIMEX', label: 'DIMEX', mask: '############', maxLength: 12, isDefault: false },
  ];

  /** Default screen content shown immediately while CMS data loads. */
  private static readonly DEFAULT_SCREEN_CONTENT: ScreenContent = {
    screenKey: 'basic-data',
    copy: {
      headline: 'Su tarjeta está muy cerca',
      description: 'Siga estos sencillos pasos para completar su registro.',
      ctaLabel: 'Continuar',
      legalNotice: 'Este sitio está protegido por reCAPTCHA y las Políticas de Privacidad y Términos de Servicio de Google que aplican.',
    },
    media: { gifUrl: '', gifAlt: '' },
    branding: { cardBackground: '#e8f5e9' },
  };

  /** Country options for the select-field. */
  protected readonly countryOptions: CountryOption[] = [
    { value: '+506', label: '+506' },
    { value: '+1',   label: '+1' },
    { value: '+52',  label: '+52' },
    { value: '+57',  label: '+57' },
  ];

  /** Identification types from AdminConfig — updated asynchronously after mount. */
  readonly identificationTypes = signal<IdentificationTypeConfig[]>(BasicData.DEFAULT_ID_TYPES);

  /** Screen content (texts, GIF, branding) from CMS — updated asynchronously after mount. */
  readonly screenContent = signal<ScreenContent>(BasicData.DEFAULT_SCREEN_CONTENT);

  /** Index of the currently selected identification type. */
  protected readonly selectedIndex = signal(0);

  /** Current identification type config (drives mask, placeholder, maxLength). */
  protected readonly currentIdType = computed(() => {
    const types = this.identificationTypes();
    const idx = this.selectedIndex();
    return types[idx] ?? types[0];
  });

  /** Raw ID number value (digits only, separators handled by lib-text-field). */
  protected readonly idNumber = signal('');

  /** Whether the ID field has been blurred at least once. */
  protected readonly idTouched = signal(false);

  /** Validation error shown after blur. */
  protected readonly idError = signal<string | null>(null);

  /** Loading state while simulating Core API lookup. */
  protected readonly isIdLoading = signal(false);

  /** True when contact fields should be visible (after successful ID validation). */
  protected readonly showContactFields = signal(false);

  /** Contact form data. */
  protected readonly contact = signal<ContactData>({
    countryCode: '+506',
    phone: '',
    email: '',
  });

  /** Whether the phone field has been blurred at least once. */
  protected readonly phoneTouched = signal(false);

  /** Phone validation error. */
  protected readonly phoneError = signal<string | null>(null);

  /** Whether the email field has been blurred at least once. */
  protected readonly emailTouched = signal(false);

  /** Email validation error. */
  protected readonly emailError = signal<string | null>(null);

  /** True when the ID field has a valid length for the current type. */
  protected readonly isIdComplete = computed(() => {
    const value = this.idNumber();
    const required = this.currentIdType().maxLength;
    return value.length === required;
  });

  /** True when all contact fields have values. */
  protected readonly isContactComplete = computed(() => {
    const c = this.contact();
    return c.countryCode.length > 0 && c.phone.length >= 8 && c.email.length > 0;
  });

  /** True when the entire form is valid and ready to continue. */
  protected readonly canContinue = computed(() => {
    return this.isIdComplete() && this.showContactFields() && this.isContactComplete();
  });

  constructor() {
    // Load real data in the background without blocking render.
    // Defaults are already shown so the user sees content immediately.
    this.adminConfig.getIdentificationTypes().then(result => {
      if (result.success) {
        this.identificationTypes.set(result.value);
      }
    });

    this.screenContentAdapter.load('basic-data').then(result => {
      if (result.success) {
        this.screenContent.set(result.value);
      }
    });
  }

  protected readonly mask = computed(() => this.currentIdType().mask);

  protected readonly placeholder = computed(() => this.currentIdType().mask);

  selectIdType(index: number): void {
    if (index === this.selectedIndex()) return;
    this.selectedIndex.set(index);
    this.idNumber.set('');
    this.idTouched.set(false);
    this.idError.set(null);
    this.isIdLoading.set(false);
    this.showContactFields.set(false);
    this.contact.set({ countryCode: '+506', phone: '', email: '' });
    this.phoneTouched.set(false);
    this.phoneError.set(null);
    this.emailTouched.set(false);
    this.emailError.set(null);
  }

  onIdValueChange(value: string): void {
    this.idNumber.set(value);
    this.idError.set(null);

    if (this.showContactFields()) {
      this.showContactFields.set(false);
      this.contact.set({ countryCode: '+506', phone: '', email: '' });
    }

    const required = this.currentIdType().maxLength;
    if (value.length === required && !this.isIdLoading()) {
      this.isIdLoading.set(true);
      // Simulate Core API call (1.5s delay)
      setTimeout(() => {
        this.isIdLoading.set(false);
        this.showContactFields.set(true);
      }, 1500);
    }
  }

  onIdBlur(): void {
    this.idTouched.set(true);
    const value = this.idNumber();
    const required = this.currentIdType().maxLength;
    if (value.length > 0 && value.length < required) {
      this.idError.set(`Longitud requerida: ${required} caracteres`);
    }
  }

  onPhoneValueChange(value: string): void {
    this.contact.update(c => ({ ...c, phone: value }));
    this.phoneError.set(null);
  }

  onPhoneBlur(): void {
    this.phoneTouched.set(true);
    const phone = this.contact().phone.replace(/-/g, '').trim();
    if (phone.length > 0 && phone.length < 8) {
      this.phoneError.set('Longitud requerida: 8 dígitos');
    }
  }

  onEmailValueChange(value: string): void {
    this.contact.update(c => ({ ...c, email: value }));
    this.emailError.set(null);
  }

  onEmailBlur(): void {
    this.emailTouched.set(true);
    const email = this.contact().email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (email.length > 0 && !emailRegex.test(email)) {
      this.emailError.set('Formato de correo inválido');
    }
  }

  onCountryChange(value: string | string[] | null): void {
    const countryCode = Array.isArray(value) ? value[0] : value;
    if (countryCode) {
      this.contact.update(c => ({ ...c, countryCode }));
    }
  }

  /** Maps the raw id-type string from AdminConfig to the domain IdentificationType enum. */
  private static readonly ID_TYPE_MAP: Record<string, IdentificationType> = {
    NACIONAL: IdentificationType.National,
    DIMEX: IdentificationType.DIMEX,
  };

  async onContinue(): Promise<void> {
    if (!this.canContinue()) return;

    const rawIdType = this.currentIdType().id;
    const idType = BasicData.ID_TYPE_MAP[rawIdType] ?? IdentificationType.National;
    const identification = new Identification(idType, this.idNumber());

    this.facade.setLoading(true);
    const result = await this.facade.determineUserType.execute(identification);
    this.facade.setLoading(false);

    if (!result.success) {
      this.facade.setError('No se pudo verificar su identidad. Intente nuevamente.');
      return;
    }

    const { existingApplication } = result.value;

    if (existingApplication !== null) {
      this.facade.setApplication(existingApplication);
    } else {
      // New client: create a provisional application.
      // TODO: real application id assigned by Core on save (PR-B/backend)
      const newApp = CreditApplication.create(identification.number, identification);
      this.facade.setApplication(newApp);
    }

    // Fetch the person name from TSE to greet the user on the next screen.
    // Non-blocking: if TSE fails we still continue navigation.
    const tseResult = await this.facade.tseQuery.findByIdentification(identification.number);
    if (tseResult.success && tseResult.value !== null) {
      this.facade.setPersonName(tseResult.value);
    }

    // Route by user type:
    //   NewClient   → Consent screen (new onboarding flow)
    //   Any other   → Retomando screen (resume existing application)
    const isNewClient = existingApplication === null;
    const targetRoute = isNewClient ? '/request/consent' : '/request/retomando';
    await this.router.navigate([targetRoute]);
  }
}

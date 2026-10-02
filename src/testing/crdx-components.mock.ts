/**
 * Stub module that replaces `crdx-components` in Vitest runs.
 *
 * BasicData imports LibButtonComponent, LibChipComponent,
 * LibTextFieldComponent, and LibSelectFieldComponent.
 * Consent imports LibCheckboxComponent and LibButtonComponent.
 * Vitest resolves `crdx-components` to this file (vitest.config.ts alias),
 * which exports minimal standalone stub components so Angular TestBed is satisfied.
 */
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'lib-button',
  standalone: true,
  template: `<ng-content />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibButtonComponent {
  disabled = input(false);
  variant = input<string>('filled');
  size = input<string>('medium');
  fullWidth = input(false);
  type = input<'button' | 'submit' | 'reset'>('button');
}

@Component({
  selector: 'lib-chip',
  standalone: true,
  template: `<ng-content />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibChipComponent {
  label = input<string>('');
  isSelected = input(false);
}

@Component({
  selector: 'lib-text-field',
  standalone: true,
  template: `<ng-content />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibTextFieldComponent {
  value = input<string>('');
  label = input<string>('');
  mask = input<string>('');
  placeholder = input<string>('');
  maxLength = input<number>(100);
  error = input<string | null>(null);
  loading = input(false);
  valueChange = output<string>();
  blurred = output<void>();
}

@Component({
  selector: 'lib-select-field',
  standalone: true,
  template: `<ng-content />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibSelectFieldComponent {
  value = input<string | null>(null);
  label = input<string>('');
  options = input<{ value: string; label: string }[]>([]);
  valueChange = output<string | string[] | null>();
}

@Component({
  selector: 'lib-checkbox',
  standalone: true,
  template: `<ng-content />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibCheckboxComponent {
  checked = input(false);
  disabled = input(false);
  error = input(false);
  checkedChange = output<boolean>();
  indeterminateChange = output<boolean>();
}

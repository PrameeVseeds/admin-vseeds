import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { NzMessageService } from 'ng-zorro-antd/message';
import { openConfirm } from 'src/app/shared/utils/modal-helpers';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { InvoiceTemplateService } from 'src/app/core/services/invoiceTemplate.service';
import {
  DEFAULT_INVOICE_SETTINGS,
  INVOICE_LAYOUTS,
  InvoiceLayoutId,
  InvoiceTemplateSettings,
  SAMPLE_INVOICE,
  buildInvoiceBody,
  buildInvoiceCss,
  buildInvoiceDocument,
  invoiceCssVars,
} from './invoice-doc';

export interface InvoiceTemplateVersion {
  id: string;
  name: string;
  settings: InvoiceTemplateSettings;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Fill in fields missing from older saved templates. */
function normalizeSettings(raw: Partial<InvoiceTemplateSettings> | null | undefined): InvoiceTemplateSettings {
  return { ...DEFAULT_INVOICE_SETTINGS, ...(raw ?? {}) };
}

/**
 * Invoice template manager: create, customize layout & content, save versions,
 * mark one version active/inactive, edit, delete, and print a sample.
 * Route: /invoices
 */
@Component({
  selector: 'app-invoice-template',
  standalone: true,
  imports: [CommonModule, FormsModule, NzModalModule],
  templateUrl: './invoiceTemplate.html',
  styleUrl: './invoiceTemplate.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceTemplateComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly layouts = INVOICE_LAYOUTS;
  readonly sample = SAMPLE_INVOICE;

  readonly versions = signal<InvoiceTemplateVersion[]>([]);
  readonly editingId = signal<string | null>(null);
  readonly draft = signal<InvoiceTemplateSettings>({ ...DEFAULT_INVOICE_SETTINGS });
  readonly draftName = signal<string>('');
  readonly isEditorOpen = signal(false);

  readonly activeVersion = computed(() => this.versions().find((v) => v.isActive) ?? null);
  readonly previewSettings = computed(() =>
    this.isEditorOpen()
      ? this.draft()
      : this.activeVersion()?.settings
        ? normalizeSettings(this.activeVersion()!.settings)
        : DEFAULT_INVOICE_SETTINGS,
  );

  /** Shared stylesheet for the invoice document (preview + print). Injected once. */
  readonly docStyle = this.sanitizer.bypassSecurityTrustHtml(`<style>${buildInvoiceCss()}</style>`);

  /** WYSIWYG body — the exact same renderer used by the print window. */
  readonly previewHtml = computed(() => {
    const s = this.previewSettings();
    const vars = Object.entries(invoiceCssVars(s))
      .map(([k, v]) => `${k}:${v};`)
      .join('');
    return this.sanitizer.bypassSecurityTrustHtml(
      `<div style="${vars}">${buildInvoiceBody(s, SAMPLE_INVOICE)}</div>`,
    );
  });

  constructor(
    private readonly message: NzMessageService,
    private readonly modal: NzModalService,
    private readonly invoiceTemplateService: InvoiceTemplateService,
  ) {
    this.loadVersions();
  }

  startNew(): void {
    const base = this.previewSettings();
    this.editingId.set(null);
    this.draft.set({ ...normalizeSettings(base) });
    this.draftName.set(`Version ${this.versions().length + 1}`);
    this.isEditorOpen.set(true);
  }

  editVersion(version: InvoiceTemplateVersion): void {
    this.editingId.set(version.id);
    this.draft.set(normalizeSettings(version.settings));
    this.draftName.set(version.name);
    this.isEditorOpen.set(true);
  }

  cancelEdit(): void {
    this.isEditorOpen.set(false);
    this.editingId.set(null);
  }

  updateDraftField<K extends keyof InvoiceTemplateSettings>(
    key: K,
    value: InvoiceTemplateSettings[K],
  ): void {
    this.draft.update((d) => ({ ...d, [key]: value }));
  }

  setLayout(id: InvoiceLayoutId): void {
    this.updateDraftField('layout', id);
  }

  toggleFlag(key: 'showLogo' | 'showNotes' | 'showTerms' | 'showSignature'): void {
    this.draft.update((d) => ({ ...d, [key]: !d[key] }));
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.updateDraftField('companyLogo', reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.updateDraftField('companyLogo', null);
  }

  saveVersion(): void {
    const name = this.draftName().trim() || `Version ${this.versions().length + 1}`;
    const editingId = this.editingId();

    if (editingId) {
      this.invoiceTemplateService
        .update(editingId, { name, settings: this.draft() })
        .subscribe({
          next: () => {
            this.message.success('Template updated');
            this.loadVersions();
            this.isEditorOpen.set(false);
            this.editingId.set(null);
          },
          error: () => this.message.error('Failed to update template'),
        });
      return;
    }

    this.invoiceTemplateService
      .create({
        name,
        settings: this.draft(),
        isActive: this.versions().length === 0,
      })
      .subscribe({
        next: () => {
          this.message.success('New template version saved');
          this.loadVersions();
          this.isEditorOpen.set(false);
          this.editingId.set(null);
        },
        error: () => this.message.error('Failed to save template'),
      });
  }

  setActive(id: string): void {
    this.invoiceTemplateService.activate(id).subscribe({
      next: () => {
        this.message.success('Template set as active');
        this.loadVersions();
      },
      error: () => this.message.error('Failed to set template as active'),
    });
  }

  setInactive(id: string): void {
    this.invoiceTemplateService.deactivate(id).subscribe({
      next: () => {
        this.message.info('Template set to inactive');
        this.loadVersions();
      },
      error: () => this.message.error('Failed to set template as inactive'),
    });
  }

  deleteVersion(version: InvoiceTemplateVersion): void {
    openConfirm(this.modal, {
      title: 'Delete template version',
      description: `Are you sure you want to delete "${version.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      iconName: 'trash-2',
    }).afterClose.subscribe((confirmed) => {
      if (!confirmed) return;
      this.invoiceTemplateService.delete(version.id).subscribe({
        next: () => {
          this.message.success('Template version deleted');
          this.loadVersions();
          if (this.editingId() === version.id) {
            this.cancelEdit();
          }
        },
        error: () => this.message.error('Failed to delete template'),
      });
    });
  }

  printSample(settings?: InvoiceTemplateSettings): void {
    const s = settings ? normalizeSettings(settings) : this.draft();

    const win = window.open('', '_blank');
    if (!win) {
      this.message.error('Pop-up blocked. Allow pop-ups to print the sample invoice.');
      return;
    }

    let printed = false;
    const doPrint = () => {
      if (printed) return;
      printed = true;
      win.focus();
      win.print();
    };
    win.onload = doPrint;
    win.document.write(buildInvoiceDocument(s, SAMPLE_INVOICE));
    win.document.close();
    setTimeout(doPrint, 400);
  }

  private loadVersions(): void {
    this.invoiceTemplateService.getAll().subscribe({
      next: (list) => {
        this.versions.set(
          list.map((v: any) => ({
            id: v.id,
            name: v.name,
            settings: normalizeSettings(v.settings),
            isActive: v.isActive,
            createdAt: v.createdAt ? new Date(v.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: v.updatedAt ? new Date(v.updatedAt).toISOString() : new Date().toISOString(),
          })),
        );
      },
      error: () => this.message.error('Failed to load invoice templates'),
    });
  }
}

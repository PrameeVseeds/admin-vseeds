import { Component, ChangeDetectionStrategy, effect, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { LucideAngularModule } from 'lucide-angular';
import { SettingsService } from 'src/app/core/services/settingsService';
import { openConfirm } from 'src/app/shared/utils/modal-helpers';
import { FloatLabelComponent } from '@shared/components/float-label/float-label.component';

const DEFAULTS = {
  maintenanceMode: false,
  maintenanceMessage: '',
  acceptOrders: true,
  allowRegistration: true,
  allowReviews: true,
  enableWishlist: true,
  shippingFee: 0,
  taxEnabled: false,
  taxPercentage: 0,
  notifyOrders: true,
  notifyContacts: true,
  notifyLowStock: true,
  notifyReviews: false,
  notificationEmail: 'admin@vseeds.com',
} as const;

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzSwitchModule,
    NzInputModule,
    NzInputNumberModule,
    NzModalModule,
    LucideAngularModule,
    FloatLabelComponent,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './systemSettings.html',
  styleUrl: './systemSettings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemSettingsComponent {
  protected readonly settings: any;

  readonly form: any;

  // ── Database dumps ──────────────────────────────────────────────
  protected readonly dbDumps = signal<{ latest: any; old: any }>({ latest: null, old: null });
  protected readonly dbImportStatus = signal<{ latest: any; old: any }>({ latest: null, old: null });
  protected readonly dbUploading = signal<{ latest: boolean; old: boolean }>({ latest: false, old: false });
  protected readonly dbImporting = signal<{ latest: boolean; old: boolean }>({ latest: false, old: false });
  protected readonly dbBackingUp = signal(false);
  protected readonly dbClearFirst = signal(false);
  protected readonly selectedDbFiles: Record<'latest' | 'old', File | null> = { latest: null, old: null };

  constructor(
    private readonly message: NzMessageService,
    private readonly modal: NzModalService,
    private readonly settingsService: SettingsService,
    private readonly fb: FormBuilder,
  ) {
    this.settings = this.settingsService.getAll();
    this.form = this.fb.group({
      maintenanceMode: [DEFAULTS.maintenanceMode],
      maintenanceMessage: [DEFAULTS.maintenanceMessage],
      acceptOrders: [DEFAULTS.acceptOrders],
      allowRegistration: [DEFAULTS.allowRegistration],
      allowReviews: [DEFAULTS.allowReviews],
      enableWishlist: [DEFAULTS.enableWishlist],
      shippingFee: [DEFAULTS.shippingFee],
      taxEnabled: [DEFAULTS.taxEnabled],
      taxPercentage: [DEFAULTS.taxPercentage],
      notifyOrders: [DEFAULTS.notifyOrders],
      notifyContacts: [DEFAULTS.notifyContacts],
      notifyLowStock: [DEFAULTS.notifyLowStock],
      notifyReviews: [DEFAULTS.notifyReviews],
      notificationEmail: [DEFAULTS.notificationEmail],
    });
    effect(() => {
      const s = this.settings();
      if (s && Object.keys(s).length > 0) {
        this.form.patchValue(
          {
            maintenanceMode: s['maintenanceMode'] ?? DEFAULTS.maintenanceMode,
            maintenanceMessage: s['maintenanceMessage'] ?? DEFAULTS.maintenanceMessage,
            acceptOrders: s['acceptOrders'] ?? DEFAULTS.acceptOrders,
            allowRegistration: s['allowRegistration'] ?? DEFAULTS.allowRegistration,
            allowReviews: s['allowReviews'] ?? DEFAULTS.allowReviews,
            enableWishlist: s['enableWishlist'] ?? DEFAULTS.enableWishlist,
            shippingFee: s['shippingFee'] ?? DEFAULTS.shippingFee,
            taxEnabled: s['taxEnabled'] ?? DEFAULTS.taxEnabled,
            taxPercentage: s['taxPercentage'] ?? DEFAULTS.taxPercentage,
            notifyOrders: s['notifyOrders'] ?? DEFAULTS.notifyOrders,
            notifyContacts: s['notifyContacts'] ?? DEFAULTS.notifyContacts,
            notifyLowStock: s['notifyLowStock'] ?? DEFAULTS.notifyLowStock,
            notifyReviews: s['notifyReviews'] ?? DEFAULTS.notifyReviews,
            notificationEmail: s['notificationEmail'] ?? DEFAULTS.notificationEmail,
          },
          { emitEvent: false },
        );
      }
    });

    this.refreshDbDumps();
    this.refreshImportStatus();
  }

  saveSettings(): void {
    this.settingsService.bulkUpdate(this.form.getRawValue());
    this.message.success('Settings saved successfully');
  }

  clearCache(): void {
    const ref = openConfirm(this.modal, {
      title: 'Clear System Cache',
      description:
        'This will clear all cached data. The system may temporarily slow down while the cache rebuilds.',
      confirmText: 'Clear Cache',
      cancelText: 'Cancel',
      iconName: 'alert-triangle',
    }, { width: '420px' });

    ref.afterClose.subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.message.success('System cache cleared successfully');
      }
    });
  }

  // ── Database dump handlers ──────────────────────────────────────

  refreshDbDumps(): void {
    this.settingsService.getDbDumps().subscribe({
      next: (res) => this.dbDumps.set(res?.data ?? { latest: null, old: null }),
      error: () => undefined,
    });
  }

  refreshImportStatus(): void {
    this.settingsService.getDbImportStatus().subscribe({
      next: (res) => this.dbImportStatus.set(res?.data ?? { latest: null, old: null }),
      error: () => undefined,
    });
  }

  onDbFileSelected(type: 'latest' | 'old', event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file && !/\.sql$/i.test(file.name)) {
      this.message.error('Only .sql files are accepted');
      input.value = '';
      return;
    }
    this.selectedDbFiles[type] = file;
    if (file) this.uploadDbDump(type);
    input.value = '';
  }

  uploadDbDump(type: 'latest' | 'old'): void {
    const file = this.selectedDbFiles[type];
    if (!file) return;
    this.dbUploading.update((s) => ({ ...s, [type]: true }));
    this.settingsService.uploadDbDump(type, file).subscribe({
      next: () => {
        this.dbUploading.update((s) => ({ ...s, [type]: false }));
        this.message.success(`${type === 'latest' ? 'Latest' : 'Old'} DB dump uploaded`);
        this.refreshDbDumps();
      },
      error: (err) => {
        this.dbUploading.update((s) => ({ ...s, [type]: false }));
        this.message.error(err?.error?.message || 'Upload failed');
      },
    });
  }

  runDbImport(type: 'latest' | 'old'): void {
    const isLatest = type === 'latest';
    const clear = !isLatest && this.dbClearFirst();
    const ref = openConfirm(
      this.modal,
      {
        title: isLatest ? 'Restore Latest Database' : 'Migrate Old Database',
        description: isLatest
          ? 'This will execute the uploaded SQL dump against the live database. Existing data may be overwritten. Continue?'
          : clear
            ? 'This will permanently DELETE all existing business data (products, orders, users, etc.), then run the legacy migration. Admin accounts and system settings are kept. Continue?'
            : 'This will run the legacy migration script using the uploaded old DB dump. Continue?',
        confirmText: clear ? 'Clear & Migrate' : 'Run Import',
        cancelText: 'Cancel',
        iconName: 'database',
      },
      { width: '460px' },
    );

    ref.afterClose.subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.dbImporting.update((s) => ({ ...s, [type]: true }));
      this.settingsService.importDbDump(type, clear).subscribe({
        next: () => {
          this.message.success('Import started');
          this.pollImportStatus(type);
        },
        error: (err) => {
          this.dbImporting.update((s) => ({ ...s, [type]: false }));
          this.message.error(err?.error?.message || 'Failed to start import');
        },
      });
    });
  }

  /** Last N log lines for display under the status badge. */
  tailLog(logTail: string[], count = 12): string {
    return (logTail ?? []).slice(-count).join('\n');
  }

  downloadBackup(): void {
    if (this.dbBackingUp()) return;
    this.dbBackingUp.set(true);
    this.settingsService.downloadDbBackup().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vseeds_backup_${new Date().toISOString().slice(0, 10)}.sql`;
        a.click();
        URL.revokeObjectURL(url);
        this.dbBackingUp.set(false);
        this.message.success('Database backup downloaded');
      },
      error: () => {
        this.dbBackingUp.set(false);
        this.message.error('Failed to generate backup');
      },
    });
  }

  private pollImportStatus(type: 'latest' | 'old'): void {
    const tick = () => {
      this.settingsService.getDbImportStatus().subscribe({
        next: (res) => {
          const all = res?.data ?? {};
          this.dbImportStatus.set({ latest: all.latest ?? null, old: all.old ?? null });
          const st = all[type];
          if (st?.status === 'running') {
            setTimeout(tick, 3000);
          } else {
            this.dbImporting.update((s) => ({ ...s, [type]: false }));
            if (st?.status === 'success') this.message.success('Import completed');
            else if (st?.status === 'failed') this.message.error(st.error || 'Import failed');
          }
        },
        error: () => this.dbImporting.update((s) => ({ ...s, [type]: false })),
      });
    };
    setTimeout(tick, 1500);
  }

  resetSettings(): void {
    const ref = openConfirm(this.modal, {
      title: 'Reset to Defaults',
      description:
        'This will reset all settings to their default values. This action cannot be undone.',
      confirmText: 'Reset',
      cancelText: 'Cancel',
      iconName: 'rotate-ccw',
    }, { width: '420px' });

    ref.afterClose.subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.form.reset(DEFAULTS);
        this.message.success('Settings reset to defaults');
      }
    });
  }
}

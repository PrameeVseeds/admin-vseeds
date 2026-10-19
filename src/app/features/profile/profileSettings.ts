import { Component, ChangeDetectionStrategy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '@services/authService';
import { TokenStorageService } from '@services/tokenStorageService';
import { ActivityLogService } from '@services/activityLogService';
import { FloatLabelComponent } from '@shared/components/float-label/float-label.component';
import { MyValidators } from 'src/app/shared/validators/custom-validator';
import { PasswordFormComponent } from './components/password-form/password-form.component';
import { TwoFactorComponent } from './components/two-factor/two-factor.component';
import { SessionListComponent } from './components/session-list/session-list.component';
import { formatDateTime, formatDateOnly } from 'src/app/shared/pipes/date-format.pipe';

interface SessionEntry {
  id: string;
  ip: string;
  time: string;
  timeAgo: string;
  browser: string;
}

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzInputModule,
    NzTooltipModule,
    LucideAngularModule,
    FloatLabelComponent,
    PasswordFormComponent,
    TwoFactorComponent,
    SessionListComponent,
  ],
  templateUrl: './profileSettings.html',
  styleUrl: './profileSettings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSettingsComponent implements OnInit {
  loading = signal(false);
  is2faEnabled = signal(false);

  protected readonly form: any;
  protected readonly userRole: any;
  protected readonly userAvatar: any;
  protected readonly joinedDate: any;

  protected readonly lastLogin = signal<string>('—');
  protected readonly sessions = signal<SessionEntry[]>([]);

  ngOnInit(): void {
    this.loadProfile();
    this.loadLoginActivity();
  }

  private loadProfile(): void {
    this.authService.fetchProfile().subscribe({
      next: (res) => {
        const user = res.data;
        if (user) {
          this.form.patchValue({
            username: user.username || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
          });
          this.is2faEnabled.set(!!user.twoFactorEnabled);
        }
      },
    });
  }

  private loadLoginActivity(): void {
    const userId = this.tokenStorage.user()?.id;
    const params = `action=login&actor_type=admin${userId ? '&actor_id=' + userId : ''}&limit=10`;
    this.activityLogService.query(params).subscribe({
      next: (res) => {
        const logs = res.data?.logs ?? res.data ?? [];
        if (!Array.isArray(logs) || logs.length === 0) return;

        const date = new Date(logs[0].createdAt || logs[0].created_at);
        this.lastLogin.set(formatDateTime(date));

        this.sessions.set(
          logs.map((l: any) => {
            const d = new Date(l.createdAt || l.created_at);
            return {
              id: l.id,
              ip: l.ipAddress || l.ip_address || '—',
              time: formatDateTime(d),
              timeAgo: this.timeAgo(d),
              browser: this.parseBrowser(l.userAgent || l.user_agent || ''),
            };
          }),
        );
      },
      error: () => {},
    });
  }

  removeSession(session: SessionEntry): void {
    this.activityLogService.deleteLog(session.id).subscribe({
      next: () => {
        this.sessions.update((list: any) => list.filter((s: any) => s.id !== session.id));
        this.message.success('Session removed');
      },
      error: () => this.message.error('Failed to remove session'),
    });
  }

  onSaveProfile(): void {
    if (this.form.valid) {
      this.loading.set(true);
      const { email, ...updateData } = this.form.getRawValue();
      this.authService.updateProfile(updateData).subscribe({
        next: () => {
          this.loading.set(false);
          this.message.success('Profile updated successfully');
        },
        error: () => {
          this.loading.set(false);
          this.message.error('Failed to update profile');
        },
      });
    }
  }

  private timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  private parseBrowser(ua: string): string {
    if (!ua) return 'Unknown';
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    return 'Other';
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly message: NzMessageService,
    private readonly authService: AuthService,
    protected readonly tokenStorage: TokenStorageService,
    private readonly activityLogService: ActivityLogService,
  ) {
    this.form = this.fb.nonNullable.group({
      username: ['', [Validators.required, MyValidators.spaceValidator()]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [MyValidators.numberValidator()]],
      address: [''],
    });

    this.userRole = computed(() => this.tokenStorage.user()?.role || 'Admin');
    this.userAvatar = computed(() => this.tokenStorage.user()?.avatar ?? undefined);
    this.joinedDate = computed(() => {
      const raw = this.tokenStorage.user()?.createdAt;
      return raw ? formatDateOnly(raw) : '—';
    });
  }
}

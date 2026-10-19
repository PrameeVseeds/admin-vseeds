import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzMessageService } from 'ng-zorro-antd/message';
import { BannerService } from 'src/app/core/services/bannerService';
import { FloatLabelComponent } from 'src/app/shared/components/float-label/float-label.component';
import { FormErrorComponent } from 'src/app/shared/components/form-error/form-error.component';

@Component({
  selector: 'app-banner-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzCardModule,
    NzDatePickerModule,
    NzDividerModule,
    LucideAngularModule,
    FloatLabelComponent,
    FormErrorComponent,
  ],
  templateUrl: './banner-form.component.html',
  styleUrls: ['./banner-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerFormComponent {
  readonly bannerId: string | null;
  readonly isEditMode: boolean;

  readonly deviceOptions = ['Desktop', 'Mobile'];

  previewImage: string | undefined = '';
  imageFile: File | null = null;

  private readonly titleSignal = signal('');
  readonly imagePrompt = computed(() => {
    const title = this.titleSignal();
    if (!title.trim()) return '';
    return `Professional high-resolution promotional banner for "${title}". Wide 16:5 aspect ratio, vibrant and eye-catching design with bold typography, suitable for an electronics e-commerce website hero section. Include the brand name "VSEEDS.LK" prominently displayed in the design. Also include the VSEEDS logo — a dark teal-green abstract lettermark with interconnected flowing lines and horizontal stripes inside a rounded square frame.`;
  });

  readonly form: any;

  constructor(private readonly fb: FormBuilder, private readonly route: ActivatedRoute, private readonly router: Router, private readonly message: NzMessageService, private readonly bannerService: BannerService) {
      this.bannerId = this.route.snapshot.paramMap.get('id');
      this.isEditMode = !!this.bannerId;
      this.form = this.fb.group({
          title: ['', [Validators.required]],
          device: [null as string | null, [Validators.required]],
          startDate: [null as Date | null, [Validators.required]],
          endDate: [null as Date | null],
          status: ['Scheduled', [Validators.required]],
        });
    this.form.controls.title.valueChanges.subscribe((v: any) => this.titleSignal.set(v ?? ''));

    if (this.isEditMode) {
      this.bannerService.loadById(this.bannerId!).subscribe({
        next: (res: any) => {
          const banner = res?.data ?? res;
          if (banner) {
            const now = new Date();
            let status = banner.isActive ? 'Active' : 'Inactive';
            if (banner.isActive) {
              if (banner.startsAt && new Date(banner.startsAt) > now) {
                status = 'Scheduled';
              } else if (banner.endsAt && new Date(banner.endsAt) < now) {
                status = 'Expired';
              }
            }
            this.form.patchValue({
              title: banner.title,
              device: banner.deviceType === 'mobile' ? 'Mobile' : 'Desktop',
              startDate: banner.startsAt ? new Date(banner.startsAt) : null,
              endDate: banner.endsAt ? new Date(banner.endsAt) : null,
              status: status,
            });
            this.previewImage = banner.imageUrl || '';
          }
        },
      });
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.message.error('Please select an image file');
        return;
      }
      this.imageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => (this.previewImage = e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  submit(): void {
    if (this.form.valid) {
      if (!this.imageFile && !this.isEditMode) {
        this.message.error('Please upload a banner image!');
        return;
      }

      const v = this.form.value;
      const formData = new FormData();
      if (this.imageFile) {
        formData.append('image', this.imageFile);
      }
      formData.append('title', v.title || '');
      formData.append('deviceType', (v.device || 'Desktop').toLowerCase());
      formData.append('isActive', (v.status !== 'Inactive').toString());
      formData.append('startsAt', v.startDate ? v.startDate.toISOString() : '');
      formData.append('endsAt', v.endDate ? v.endDate.toISOString() : '');

      if (this.isEditMode) {
        this.bannerService.update(this.bannerId!, formData).subscribe({
          next: () => {
            this.message.success('Banner updated successfully');
            this.router.navigate(['/banners']);
          },
          error: (err) => {
            this.message.error(err.error?.message || 'Failed to update banner');
          },
        });
      } else {
        this.bannerService.add(formData).subscribe({
          next: () => {
            this.message.success('Banner added successfully');
            this.router.navigate(['/banners']);
          },
          error: (err) => {
            this.message.error(err.error?.message || 'Failed to add banner');
          },
        });
      }
    } else {
      Object.values(this.form.controls).forEach((control: any) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  copyImagePrompt(): void {
    const prompt = this.imagePrompt();
    if (!prompt) {
      this.message.warning('Enter a banner title first to generate a prompt');
      return;
    }
    navigator.clipboard.writeText(prompt).then(() => {
      this.message.success('Prompt copied to clipboard');
    });
  }

  goBack(): void {
    this.router.navigate(['/banners']);
  }
}

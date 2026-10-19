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
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { QuillModule } from 'ngx-quill';
import { ProjectService } from 'src/app/core/services/projectService';
import { ImageService } from 'src/app/core/services/imageService';
import { FloatLabelComponent } from 'src/app/shared/components/float-label/float-label.component';
import { FormErrorComponent } from 'src/app/shared/components/form-error/form-error.component';

@Component({
  selector: 'app-project-form',
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
    NzUploadModule,
    NzDividerModule,
    LucideAngularModule,
    QuillModule,
    FloatLabelComponent,
    FormErrorComponent,
  ],
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectFormComponent {
  readonly projectId: string | null;
  readonly isEditMode: boolean;

  readonly categoryOptions = signal([
    'Electronics',
    'Embedded Systems',
    'IoT',
    'Robotics',
    'PCB Design',
  ]);
  readonly statusOptions = ['Published', 'Draft'];

  previewImage: string | undefined;
  imageFile: File | null = null;

  private readonly titleSignal = signal('');
  readonly imagePrompt = computed(() => {
    const title = this.titleSignal();
    if (!title.trim()) return '';
    return `Professional showcase image for an electronics/embedded systems project titled "${title}". Clean product photography style with a dark background, dramatic lighting, and technical details visible. Suitable for a portfolio website. Include the text "VSEEDS.LK" in the image and the VSEEDS logo — a dark teal-green abstract lettermark with interconnected flowing lines and horizontal stripes inside a rounded square frame.`;
  });

  readonly form: any;

  readonly editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ header: [1, 2, 3, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  constructor(private readonly fb: FormBuilder, private readonly route: ActivatedRoute, private readonly router: Router, private readonly message: NzMessageService, private readonly projectService: ProjectService, private readonly imageService: ImageService) {
      this.projectId = this.route.snapshot.paramMap.get('id');
      this.isEditMode = !!this.projectId;
      this.previewImage = this.projectService.DEFAULT_PROJECT_IMG;
      this.form = this.fb.group({
          title: ['', [Validators.required]],
          category: [null as string | null, [Validators.required]],
          client: [''],
          date: [null as Date | null, [Validators.required]],
          description: ['', [Validators.required]],
          status: ['Published', [Validators.required]],
          technologies: [''],
        });
    this.form.controls.title.valueChanges.subscribe((v: any) => this.titleSignal.set(v ?? ''));

    if (this.isEditMode) {
      this.projectService.loadById(this.projectId!).subscribe({
        next: (res: any) => {
          const project = res?.data ?? res;
          if (project) {
            this.form.patchValue({
              title: project.title,
              category: project.category,
              status: project.isPublic ? 'Published' : 'Draft',
              date: project.createdAt ? new Date(project.createdAt) : new Date(),
              technologies: Array.isArray(project.technologies)
                ? project.technologies.join(', ')
                : project.technologies,
              description: project.description || '',
            } as any);
            this.previewImage = project.imageUrl || '';
          }
        },
      });
    }
  }

  addCategory(input: HTMLInputElement): void {
    const value = input.value.trim();
    if (value && !this.categoryOptions().includes(value)) {
      this.categoryOptions.update((list: any) => [...list, value]);
      this.form.patchValue({ category: value });
      this.message.success(`Category "${value}" added`);
    }
    input.value = '';
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
      const val = this.form.getRawValue();
      const projectData: any = {
        title: val.title,
        category: val.category, // Backend might expect category name or ID, keeping as is
        description: val.description,
        isPublic: val.status === 'Published',
        technologies: val.technologies
          ? val.technologies.split(',').map((t: string) => t.trim())
          : [],
      };

      if (this.imageFile) {
        const formData = new FormData();
        formData.append('file', this.imageFile);
        this.imageService.upload(formData, val.title!, 'projects').subscribe({
          next: (res: any) => {
            const uploadedUrl = res?.data?.url ?? res?.url;
            if (uploadedUrl) {
              projectData.imageUrl = uploadedUrl;
            }
            this.saveProject(projectData);
          },
          error: () => this.message.error('Failed to upload project image'),
        });
      } else {
        this.saveProject(projectData);
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

  private saveProject(projectData: any): void {
    if (this.isEditMode) {
      this.projectService.update(this.projectId!, projectData).subscribe({
        next: () => {
          this.message.success('Project updated successfully');
          this.router.navigate(['/projects']);
        },
        error: (err: any) => {
          const errMsg = Array.isArray(err?.error?.message)
            ? err.error.message.join(', ')
            : err?.error?.message || 'Failed to update project';
          this.message.error(errMsg);
        },
      });
    } else {
      this.projectService.add(projectData).subscribe({
        next: () => {
          this.message.success('Project published successfully');
          this.router.navigate(['/projects']);
        },
        error: (err: any) => {
          const errMsg = Array.isArray(err?.error?.message)
            ? err.error.message.join(', ')
            : err?.error?.message || 'Failed to publish project';
          this.message.error(errMsg);
        },
      });
    }
  }

  copyImagePrompt(): void {
    const prompt = this.imagePrompt();
    if (!prompt) {
      this.message.warning('Enter a project title first to generate a prompt');
      return;
    }
    navigator.clipboard.writeText(prompt).then(() => {
      this.message.success('Prompt copied to clipboard');
    });
  }

  goBack(): void {
    this.router.navigate(['/projects']);
  }
}

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
import { BlogService } from 'src/app/core/services/blogService';
import { ImageService } from 'src/app/core/services/imageService';
import { FloatLabelComponent } from 'src/app/shared/components/float-label/float-label.component';
import { FormErrorComponent } from 'src/app/shared/components/form-error/form-error.component';

@Component({
  selector: 'app-blog-form',
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
    NzUploadModule,
    LucideAngularModule,
    QuillModule,
    FloatLabelComponent,
    FormErrorComponent,
  ],
  templateUrl: './blog-form.component.html',
  styleUrls: ['./blog-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogFormComponent {
  readonly blogId: string | null;
  readonly isEditMode: boolean;

  previewImage: string | undefined = '';
  imageFile: File | null = null;

  private readonly titleSignal = signal('');
  readonly imagePrompt = computed(() => {
    const title = this.titleSignal();
    if (!title.trim()) return '';
    return `Professional high-quality blog cover image for an article titled "${title}". Clean, modern editorial style with subtle gradients and soft lighting. 1200x630px, suitable for a tech/electronics company website. Include the text "VSEEDS.LK" subtly in a corner or as a watermark. Also include the VSEEDS logo — a small dark teal-green abstract lettermark with interconnected flowing lines and horizontal stripes inside a rounded square frame — near the brand name.`;
  });

  readonly form: any;

  readonly editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ header: [1, 2, 3, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean'],
    ],
  };

  constructor(private readonly fb: FormBuilder, private readonly route: ActivatedRoute, private readonly router: Router, private readonly message: NzMessageService, private readonly blogService: BlogService, private readonly imageService: ImageService) {
      this.blogId = this.route.snapshot.paramMap.get('id');
      this.isEditMode = !!this.blogId;
      this.form = this.fb.group({
          title: ['', [Validators.required]],
          author: ['VSEEDS Team', [Validators.required]],
          content: ['', [Validators.required]],
          status: ['Draft', [Validators.required]],
          publishDate: [null as Date | null],
          imageUrl: [''],
        });
    this.form.controls.title.valueChanges.subscribe((v: any) => this.titleSignal.set(v ?? ''));

    if (this.isEditMode) {
      this.blogService.loadById(this.blogId!).subscribe({
        next: (res: any) => {
          const blog = res?.data ?? res;
          if (blog) {
            this.form.patchValue({
              title: blog.title,
              author: blog.author,
              status: blog.status
                ? blog.status.charAt(0).toUpperCase() + blog.status.slice(1)
                : 'Draft',
              content: blog.content || '',
              publishDate: blog.publishedAt ? new Date(blog.publishedAt) : null,
            });
            this.previewImage = blog.coverImageUrl || blog.imageUrl || '';
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
      const val = this.form.getRawValue();
      const blogData = {
        title: val.title,
        author: val.author,
        content: val.content,
        status: val.status!.toLowerCase(),
        publishedAt: val.publishDate ? val.publishDate.toISOString() : null,
        coverImageUrl: val.imageUrl,
      };

      if (this.imageFile) {
        const formData = new FormData();
        formData.append('file', this.imageFile);
        this.imageService.upload(formData, val.title!, 'blogs').subscribe({
          next: (res: any) => {
            const uploadedUrl = res?.data?.url ?? res?.url;
            if (uploadedUrl) {
              blogData.coverImageUrl = uploadedUrl;
            }
            this.saveBlog(blogData);
          },
          error: () => this.message.error('Failed to upload cover image'),
        });
      } else {
        this.saveBlog(blogData);
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

  private saveBlog(blogData: any): void {
    if (this.isEditMode) {
      this.blogService.update(this.blogId!, blogData).subscribe({
        next: () => {
          this.message.success('Blog updated successfully');
          this.router.navigate(['/blogs']);
        },
        error: (err: any) => this.message.error(err?.error?.message || 'Failed to update blog'),
      });
    } else {
      this.blogService.add(blogData).subscribe({
        next: () => {
          this.message.success('Blog published successfully');
          this.router.navigate(['/blogs']);
        },
        error: () => this.message.error('Failed to publish blog'),
      });
    }
  }

  copyImagePrompt(): void {
    const prompt = this.imagePrompt();
    if (!prompt) {
      this.message.warning('Enter an article title first to generate a prompt');
      return;
    }
    navigator.clipboard.writeText(prompt).then(() => {
      this.message.success('Prompt copied to clipboard');
    });
  }

  goBack(): void {
    this.router.navigate(['/blogs']);
  }
}

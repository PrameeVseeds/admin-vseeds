import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { LucideAngularModule } from 'lucide-angular';
import { EmailTemplateService } from 'src/app/core/services/emailTemplateService';

type EmailTemplate = {
  id: string;
  name: string;
  slug: string;
  subject: string;
  category: string;
  status: string;
  body: string;
  description?: string;
  variables?: string[];
  lastModified?: string;
};

@Component({
  selector: 'app-email-template-editor',
  standalone: true,
  imports: [FormsModule, NzInputModule, NzSelectModule, NzPopconfirmModule, LucideAngularModule],
  templateUrl: './email-template-editor.component.html',
  styleUrl: './email-template-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class EmailTemplateEditorComponent implements OnInit {
  readonly template = signal<EmailTemplate | null>(null);
  readonly saving = signal(false);
  readonly sendingTest = signal(false);
  readonly deleting = signal(false);

  templateName = '';
  templateCategory = '';
  templateSubject = '';
  templateDescription = '';
  templateBody = '';
  templateVariables: string[] = [];
  newVariableName = '';

  private originalSnapshot = '';

  readonly isDirty = computed(() => {
    const tpl = this.template();
    if (!tpl) return false;
    return this.buildSnapshot() !== this.originalSnapshot;
  });

  get safePreviewHtml(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.templateBody);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;

    this.emailTemplateService.fetchById(id).subscribe({
      next: (tpl) => this.applyTemplate(tpl),
      error: () => {
        this.message.error('Template not found');
        this.router.navigate(['/email-templates']);
      },
    });
  }

  private applyTemplate(found: any): void {
    this.template.set(found);
    this.templateName = found.name ?? '';
    this.templateCategory = found.category ?? '';
    this.templateSubject = found.subject ?? '';
    this.templateDescription = found.description ?? '';
    this.templateBody = found.body ?? '';
    this.templateVariables = [...(found.variables || [])];
    this.originalSnapshot = this.buildSnapshot();
  }

  private buildSnapshot(): string {
    return JSON.stringify({
      name: this.templateName,
      category: this.templateCategory,
      subject: this.templateSubject,
      description: this.templateDescription,
      body: this.templateBody,
      variables: this.templateVariables,
    });
  }

  goBack(): void {
    this.router.navigate(['/email-templates']);
  }

  saveTemplate(): void {
    const tpl = this.template();
    if (!tpl) return;

    if (!this.templateName.trim() || !this.templateSubject.trim()) {
      this.message.warning('Template name and subject are required');
      return;
    }

    this.saving.set(true);
    this.emailTemplateService
      .update(tpl.id, {
        name: this.templateName,
        slug: tpl.slug,
        category: this.templateCategory,
        description: this.templateDescription,
        subject: this.templateSubject,
        body: this.templateBody,
        variables: this.templateVariables,
        status: tpl.status,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.originalSnapshot = this.buildSnapshot();
          this.message.success('Template saved successfully');
        },
        error: () => {
          this.saving.set(false);
          this.message.error('Failed to save template');
        },
      });
  }

  sendTestEmail(): void {
    const tpl = this.template();
    if (!tpl) return;

    this.sendingTest.set(true);
    this.emailTemplateService.sendTestEmail(tpl.id).subscribe({
      next: (res) => {
        this.sendingTest.set(false);
        const msg = res?.data?.message || res?.message;
        if (res?.data?.success === false) {
          this.message.warning(msg || 'Failed to send test email');
        } else {
          this.message.success(msg || 'Test email sent');
        }
      },
      error: () => {
        this.sendingTest.set(false);
        this.message.error('Failed to send test email. Check mail configuration.');
      },
    });
  }

  toggleStatus(): void {
    const tpl = this.template();
    if (!tpl) return;

    const newStatus = tpl.status === 'Active' ? 'Inactive' : 'Active';
    this.emailTemplateService
      .update(tpl.id, {
        ...tpl,
        status: newStatus,
      })
      .subscribe({
        next: () => {
          this.template.set({ ...tpl, status: newStatus });
          this.message.success(`Template is now ${newStatus}`);
        },
        error: () => this.message.error('Failed to update status'),
      });
  }

  deleteTemplate(): void {
    const tpl = this.template();
    if (!tpl) return;

    this.deleting.set(true);
    this.emailTemplateService.deleteTemplate(tpl.id).subscribe({
      next: () => {
        this.message.success('Template deleted');
        this.router.navigate(['/email-templates']);
      },
      error: () => {
        this.deleting.set(false);
        this.message.error('Failed to delete template');
      },
    });
  }

  copyVariable(variable: string): void {
    const text = `{{${variable}}}`;
    navigator.clipboard.writeText(text);
    this.message.success(`Copied ${text}`);
  }

  addVariable(): void {
    const name = this.newVariableName.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!name) return;

    if (this.templateVariables.includes(name)) {
      this.message.warning(`Variable "{{${name}}}" already exists`);
      return;
    }

    this.templateVariables = [...this.templateVariables, name];
    this.newVariableName = '';
    this.message.success(`Added variable "{{${name}}}"`);
  }

  removeVariable(variable: string): void {
    this.templateVariables = this.templateVariables.filter((v: any) => v !== variable);
    this.message.info(`Removed variable "{{${variable}}}"`);
  }

  formatCode(): void {
    this.templateBody = this.formatHtml(this.templateBody);
    this.message.success('Code formatted');
  }

  copyBody(): void {
    navigator.clipboard.writeText(this.templateBody);
    this.message.success('HTML copied to clipboard');
  }

  private formatHtml(html: string): string {
    const voidTags = new Set([
      'area',
      'base',
      'br',
      'col',
      'embed',
      'hr',
      'img',
      'input',
      'link',
      'meta',
      'source',
      'track',
      'wbr',
    ]);
    const inlineTags = new Set([
      'a',
      'abbr',
      'b',
      'code',
      'em',
      'i',
      'kbd',
      'span',
      'strong',
      'sub',
      'sup',
      'u',
    ]);
    const tab = '  ';

    const collapsed = html
      .replace(/\r\n/g, '\n')
      .replace(/\n\s*/g, '')
      .replace(/\s{2,}/g, ' ');

    const tokens: string[] = [];
    let i = 0;
    while (i < collapsed.length) {
      if (collapsed[i] === '<') {
        const end = collapsed.indexOf('>', i);
        if (end === -1) {
          tokens.push(collapsed.slice(i));
          break;
        }
        tokens.push(collapsed.slice(i, end + 1));
        i = end + 1;
      } else {
        const next = collapsed.indexOf('<', i);
        const text = next === -1 ? collapsed.slice(i) : collapsed.slice(i, next);
        if (text.trim()) tokens.push(text);
        i = next === -1 ? collapsed.length : next;
      }
    }

    let indent = 0;
    const lines: string[] = [];

    for (let t = 0; t < tokens.length; t++) {
      const token = tokens[t];

      if (token.startsWith('</')) {
        indent = Math.max(0, indent - 1);
        lines.push(tab.repeat(indent) + token);
        continue;
      }

      if (token.startsWith('<')) {
        const nameMatch = token.match(/^<([a-zA-Z0-9]+)/);
        const name = nameMatch?.[1]?.toLowerCase() ?? '';
        const isVoid = voidTags.has(name) || token.endsWith('/>');
        const isInline = inlineTags.has(name);

        if (
          isInline &&
          t + 2 < tokens.length &&
          !tokens[t + 1].startsWith('<') &&
          tokens[t + 2] === `</${name}>`
        ) {
          lines.push(tab.repeat(indent) + token + tokens[t + 1] + tokens[t + 2]);
          t += 2;
          continue;
        }

        lines.push(tab.repeat(indent) + token);
        if (!isVoid && !isInline) indent++;
        continue;
      }

      lines.push(tab.repeat(indent) + token);
    }

    return lines.join('\n');
  }

    constructor(private readonly route: ActivatedRoute, private readonly router: Router, private readonly sanitizer: DomSanitizer, private readonly message: NzMessageService, private readonly emailTemplateService: EmailTemplateService) {
    }
}

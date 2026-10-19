import { Routes } from '@angular/router';
import { EmailTemplateListComponent } from './emailTemplateList';

export const emailTemplateRoutes: Routes = [
  { path: '', component: EmailTemplateListComponent },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./email-template-editor/email-template-editor.component').then(
        (m) => m.EmailTemplateEditorComponent,
      ),
  },
];

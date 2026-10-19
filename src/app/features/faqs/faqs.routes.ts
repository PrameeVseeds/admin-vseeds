import { Routes } from '@angular/router';
import { FaqListComponent } from './faqList';

export const faqRoutes: Routes = [
  { path: '', title: 'FAQs', component: FaqListComponent },
  {
    path: 'create',
    title: 'Create FAQ',
    loadComponent: () => import('./faq-form/faq-form.component').then((m) => m.FaqFormComponent),
  },
  {
    path: ':id/edit',
    title: 'Edit FAQ',
    loadComponent: () => import('./faq-form/faq-form.component').then((m) => m.FaqFormComponent),
  },
];

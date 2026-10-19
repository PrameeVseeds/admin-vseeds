import { Routes } from '@angular/router';
import { AdminListComponent } from './adminList';

export const adminRoutes: Routes = [
  { path: '', title: 'Admin Users', component: AdminListComponent },
  {
    path: 'create',
    title: 'Create Admin',
    loadComponent: () =>
      import('./admin-form/admin-form.component').then((m) => m.AdminFormComponent),
  },
  {
    path: ':id/edit',
    title: 'Edit Admin',
    loadComponent: () =>
      import('./admin-form/admin-form.component').then((m) => m.AdminFormComponent),
  },
];

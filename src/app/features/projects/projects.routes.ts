import { Routes } from '@angular/router';
import { ProjectListComponent } from './projectList';

export const projectRoutes: Routes = [
  { path: '', component: ProjectListComponent },
  {
    path: 'create',
    loadComponent: () =>
      import('./project-form/project-form.component').then((m) => m.ProjectFormComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./project-form/project-form.component').then((m) => m.ProjectFormComponent),
  },
];

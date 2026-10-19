import { Routes } from '@angular/router';
import { BlogListComponent } from './blogList';

export const blogRoutes: Routes = [
  { path: '', title: 'Blogs', component: BlogListComponent },
  {
    path: 'create',
    title: 'Create Blog',
    loadComponent: () => import('./blog-form/blog-form.component').then((m) => m.BlogFormComponent),
  },
  {
    path: ':id/edit',
    title: 'Edit Blog',
    loadComponent: () => import('./blog-form/blog-form.component').then((m) => m.BlogFormComponent),
  },
];

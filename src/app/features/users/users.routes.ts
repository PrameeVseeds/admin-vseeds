import { Routes } from '@angular/router';
import { UserListComponent } from './userList';

export const userRoutes: Routes = [
  { path: '', title: 'Users', component: UserListComponent },
  { path: ':id', title: 'User Details', component: UserListComponent },
];

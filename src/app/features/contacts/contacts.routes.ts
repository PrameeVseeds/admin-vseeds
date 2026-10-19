import { Routes } from '@angular/router';
import { ContactListComponent } from './contactList';

export const contactRoutes: Routes = [
  { path: '', component: ContactListComponent },
  { path: ':id', component: ContactListComponent },
];

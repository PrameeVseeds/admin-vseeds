import { Routes } from '@angular/router';
import { QuoteListComponent } from './quoteList';

export const quoteRoutes: Routes = [
  { path: '', component: QuoteListComponent },
  { path: ':id', component: QuoteListComponent },
];

import { Routes } from '@angular/router';
import { adminGuard } from './admin.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./catalog-page/catalog-page').then((module) => module.CatalogPage),
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./admin-login/admin-login').then((module) => module.AdminLogin),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin-maintenance/admin-maintenance')
      .then((module) => module.AdminMaintenance),
  },
];

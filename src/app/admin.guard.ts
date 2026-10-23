import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { CanActivateFn, Router } from '@angular/router';
import { ADMIN_EMAIL } from '../config/admin-access';

export const adminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const auth = inject(Auth);

  await auth.authStateReady();
  const user = auth.currentUser;
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL && user.emailVerified;

  return isAdmin ? true : router.createUrlTree(['/admin/login']);
};

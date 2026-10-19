import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenStorageService } from '@services/tokenStorageService';

export const authGuard: CanActivateFn = () => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  if (tokenStorage.isLoggedIn()) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};

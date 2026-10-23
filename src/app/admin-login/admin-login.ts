import {
  Component,
  DestroyRef,
  inject,
  Injector,
  OnInit,
  runInInjectionContext,
} from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  authState,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from '@angular/fire/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import { filter, firstValueFrom, take, timeout } from 'rxjs';
import { ADMIN_EMAIL } from '../../config/admin-access';

const REDIRECT_PENDING_KEY = 'admin-google-redirect-pending';

@Component({
  imports: [RouterLink],
  selector: 'app-admin-login',
  styleUrl: './admin-login.scss',
  templateUrl: './admin-login.html',
})
export class AdminLogin implements OnInit {
  readonly adminEmail = ADMIN_EMAIL;
  errorMessage = '';
  submitting = false;

  private handlingAuthenticatedUser = false;
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);

  ngOnInit(): void {
    runInInjectionContext(this.injector, () => {
      authState(this.auth)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (user) => {
            if (user) {
              void this.handleAuthenticatedUser(user);
            }
          },
          error: (error: unknown) => {
            console.error('No se pudo comprobar la sesión del mantenimiento.', error);
            this.errorMessage = this.getAuthErrorMessage(error);
          },
        });
    });

    void this.completeRedirectSignIn();
  }

  async signIn(): Promise<void> {
    this.errorMessage = '';
    this.submitting = true;

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await runInInjectionContext(
        this.injector,
        () => signInWithPopup(this.auth, provider),
      );
      await this.handleAuthenticatedUser(result.user);
    } catch (error) {
      if (error instanceof FirebaseError && error.code === 'auth/popup-blocked') {
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          sessionStorage.setItem(REDIRECT_PENDING_KEY, 'true');
          await runInInjectionContext(
            this.injector,
            () => signInWithRedirect(this.auth, provider),
          );
          return;
        } catch (redirectError) {
          sessionStorage.removeItem(REDIRECT_PENDING_KEY);
          console.error('No se pudo iniciar sesión con redirección a Google.', redirectError);
          this.errorMessage = this.getAuthErrorMessage(redirectError);
        }
      } else {
        console.error('No se pudo iniciar sesión en el mantenimiento.', error);
        this.errorMessage = this.getAuthErrorMessage(error);
      }

      this.submitting = false;
    }
  }

  private async completeRedirectSignIn(): Promise<void> {
    const returningFromGoogle = sessionStorage.getItem(REDIRECT_PENDING_KEY) === 'true';

    try {
      const result = await runInInjectionContext(
        this.injector,
        () => getRedirectResult(this.auth),
      );
      await this.auth.authStateReady();
      const user = result?.user ?? this.auth.currentUser;

      if (user) {
        await this.handleAuthenticatedUser(user);
      } else if (returningFromGoogle && !this.submitting) {
        this.errorMessage = 'Google regresó a la aplicación, pero Firebase no detectó una sesión. Intenta de nuevo y confirma que seleccionaste la cuenta administradora.';
      }
    } catch (error) {
      console.error('No se pudo completar el inicio de sesión de Google.', error);
      this.errorMessage = this.getAuthErrorMessage(error);
    } finally {
      sessionStorage.removeItem(REDIRECT_PENDING_KEY);
    }
  }

  private async handleAuthenticatedUser(user: NonNullable<Auth['currentUser']>): Promise<void> {
    if (this.handlingAuthenticatedUser) {
      return;
    }

    this.handlingAuthenticatedUser = true;
    this.submitting = true;
    try {
      await this.openAdminForUser(user);
    } catch (error) {
      console.error('No se pudo abrir el mantenimiento del catálogo.', error);
      this.errorMessage = 'La sesión inició, pero no se pudo abrir el panel. Recarga la página e inténtalo de nuevo.';
    } finally {
      this.handlingAuthenticatedUser = false;
      this.submitting = false;
    }
  }

  private async openAdminForUser(user: NonNullable<Auth['currentUser']>): Promise<void> {
    if (user.email?.toLowerCase() !== ADMIN_EMAIL) {
      await runInInjectionContext(this.injector, () => signOut(this.auth));
      this.errorMessage = `Esta cuenta no tiene acceso al mantenimiento. Inicia sesión con ${ADMIN_EMAIL}.`;
      return;
    }

    if (!user.emailVerified) {
      await runInInjectionContext(this.injector, () => signOut(this.auth));
      this.errorMessage = 'La cuenta de Google debe tener el correo verificado para administrar el catálogo.';
      return;
    }

    await firstValueFrom(
      runInInjectionContext(this.injector, () => authState(this.auth)).pipe(
        filter((currentUser) => currentUser?.uid === user.uid),
        take(1),
        timeout({ first: 5000 }),
      ),
    );

    const navigated = await this.router.navigateByUrl('/admin');
    if (!navigated || this.router.url !== '/admin') {
      this.errorMessage = 'La sesión inició, pero no se pudo abrir el panel. Recarga la página e inténtalo de nuevo.';
    }
  }

  private getAuthErrorMessage(error: unknown): string {
    if (!(error instanceof FirebaseError)) {
      return 'Ocurrió un error inesperado al iniciar sesión. Inténtalo de nuevo.';
    }

    switch (error.code) {
      case 'auth/configuration-not-found':
        return 'Firebase Authentication aún no está configurado para este proyecto. Actívalo en Firebase Console > Authentication y habilita Google como proveedor.';
      case 'auth/operation-not-allowed':
        return 'El proveedor Google está deshabilitado. Actívalo en Firebase Console > Authentication > Sign-in method.';
      case 'auth/unauthorized-domain':
        return 'Este dominio no está autorizado. En Firebase Console > Authentication > Settings > Authorized domains, agrega localhost para desarrollo.';
      case 'auth/popup-blocked':
        return 'El navegador bloqueó la ventana de Google. Permite las ventanas emergentes para este sitio e inténtalo de nuevo.';
      case 'auth/popup-closed-by-user':
        return 'El inicio de sesión se canceló antes de completarse.';
      case 'auth/too-many-requests':
        return 'Firebase bloqueó temporalmente los intentos. Espera unos minutos antes de volver a probar.';
      case 'auth/network-request-failed':
        return 'No se pudo conectar con Firebase Authentication. Revisa tu conexión e inténtalo otra vez.';
      case 'auth/account-exists-with-different-credential':
        return 'Esta cuenta ya existe con otro método de acceso. Revisa los proveedores habilitados para el usuario en Firebase Authentication.';
      default:
        return `Firebase Authentication respondió "${error.code}". Revisa la configuración del proveedor y el estado de la cuenta.`;
    }
  }
}

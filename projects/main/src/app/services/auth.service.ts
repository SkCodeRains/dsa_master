import { inject, Injectable, signal } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  user,
} from '@angular/fire/auth';
import { defer, map, Observable } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth = inject(Auth);

  /** Surfaces the last auth error so the UI can react (e.g. show a toast). */
  readonly authError = signal<string | null>(null);

  /**
   * Signal emitting the current user's UID, or null when signed out.
   */
  readonly uid = toSignal(
    user(this.auth).pipe(map((u) => u?.uid ?? null)),
    { initialValue: null }
  );

  /**
   * Observable of the full Firebase User object. Use uid() for just the UID.
   */
  readonly user$: Observable<import('@angular/fire/auth').User | null> =
    user(this.auth);

  /**
   * Sign in with a Google popup.
   *
   * defer() ensures signInWithPopup() is only called on subscribe (i.e. when
   * the button is clicked), not at Observable construction time.
   *
   * Note: AngularFire v7+ wraps signInWithPopup with its own zone-aware proxy
   * (runOutsideAngular internally), so we must NOT additionally wrap with
   * runInInjectionContext — doing so causes AngularFire to return undefined
   * instead of the Promise, breaking RxJS's innerFrom conversion.
   */
  loginWithGoogle(): Observable<void> {
    this.authError.set(null);
    const provider = new GoogleAuthProvider();
    return defer(() => signInWithPopup(this.auth, provider)).pipe(
      map(() => void 0),
    );
  }

  /**
   * Sign out the current user.
   */
  logout(): Observable<void> {
    return defer(() => signOut(this.auth));
  }
}

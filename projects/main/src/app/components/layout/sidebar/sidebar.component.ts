import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { DataService } from '../../../services/data.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, AsyncPipe, MatIcon, FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  protected readonly authService = inject(AuthService);
  private readonly dataService = inject(DataService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly toggleSidebar = output<void>();

  readonly modules$ = this.dataService.getModules();

  /** State for adding a new module */
  readonly isAddingModule = signal(false);
  readonly newModuleTitle = signal('');

  /** Track which module IDs are expanded. */
  readonly expandedModules = signal<Set<string>>(new Set());

  /**
   * Signals derived from the current URL params.
   * Used to build the /new-problem deep-link and highlight the active day.
   */
  readonly activeModuleId = toSignal(
    this.router.events.pipe(map(() => this.router.routerState.snapshot.root.firstChild?.firstChild?.params?.['mId'] ?? null)),
    { initialValue: this.router.routerState.snapshot.root.firstChild?.firstChild?.params?.['mId'] ?? null },
  );
  readonly activeDayId = toSignal(
    this.router.events.pipe(map(() => this.router.routerState.snapshot.root.firstChild?.firstChild?.params?.['dId'] ?? null)),
    { initialValue: this.router.routerState.snapshot.root.firstChild?.firstChild?.params?.['dId'] ?? null },
  );

  /** Returns the /new-problem route segments when a day is active, otherwise null. */
  newProblemLink(): string[] | null {
    const mId = this.activeModuleId();
    const dId = this.activeDayId();
    return mId && dId ? ['/module', mId, 'day', dId, 'new-problem'] : null;
  }

  onAddModule(): void {
    this.isAddingModule.set(true);
  }

  cancelAddModule(): void {
    this.isAddingModule.set(false);
    this.newModuleTitle.set('');
  }

  saveModule(): void {
    const title = this.newModuleTitle().trim();
    if (!title) return;

    this.dataService.addModule(title).subscribe({
      next: () => {
        this.isAddingModule.set(false);
        this.newModuleTitle.set('');
      },
      error: (err) => console.error('Failed to add module:', err),
    });
  }

  toggleModule(id: string): void {
    this.expandedModules.update((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  navigateToDay(moduleId: string, dayId: string): void {
    this.router.navigate(['/module', moduleId, 'day', dayId]);
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle().subscribe({
      error: (err: { code?: string; message?: string }) => {
        // Surface the real Firebase error so we know exactly what's failing.
        // Common codes:
        //   auth/unauthorized-domain  → add localhost to Firebase Authorized Domains
        //   auth/popup-blocked        → browser blocked the popup
        //   auth/popup-closed-by-user → user closed popup (benign)
        //   auth/cancelled-popup-request → multiple popups triggered
        const code = err?.code ?? 'unknown';
        const msg = err?.message ?? String(err);
        console.error(`[AuthService] Google sign-in failed (${code}):`, msg);
        this.authService.authError.set(code);
      },
    });
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}

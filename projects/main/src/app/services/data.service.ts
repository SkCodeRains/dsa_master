import { inject, Injectable } from '@angular/core';
import {
  arrayUnion,
  collection,
  collectionData,
  doc,
  Firestore,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { from, Observable, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { Day, Module, Problem } from '../models/dsa-tracker.model';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private readonly firestore = inject(Firestore);
  private readonly authService = inject(AuthService);

  /** Base Firestore path for the current user's modules. */
  private modulesCol(uid: string) {
    return collection(this.firestore, `users/${uid}/modules`);
  }

  /**
   * Returns an Observable of all Module documents for the current user.
   * Automatically re-emits whenever the Firestore collection changes.
   */
  getModules(): Observable<Module[]> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) return from([[] as Module[]]);
        return collectionData(this.modulesCol(user.uid), {
          idField: 'id',
        }) as Observable<Module[]>;
      }),
    );
  }

  /**
   * Fetches the days array from a specific module document.
   * Since days are stored as a nested array in the module doc, we
   * re-use getModules() and project the relevant module.
   */
  getDaysForModule(moduleId: string): Observable<Day[]> {
    return new Observable<Day[]>((observer) => {
      const sub = this.getModules().subscribe({
        next: (modules) => {
          const found = modules.find((m) => m.id === moduleId);
          observer.next(found?.days ?? []);
        },
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });
      return () => sub.unsubscribe();
    });
  }

  /**
   * Pushes a new Problem into the problems array of the target day,
   * which is stored inside the module document using arrayUnion for
   * safe concurrent writes. Requires the current user to be signed in.
   */
  addProblem(
    moduleId: string,
    dayId: string,
    problemData: Omit<Problem, 'id'>,
  ): Observable<void> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) throw new Error('User must be authenticated to add a problem.');

        const problem: Problem = {
          ...problemData,
          id: crypto.randomUUID(),
        };

        // The module document holds a `days` array. We find the day and
        // push to its problems via a transaction-safe document update.
        const moduleRef = doc(this.firestore, `users/${user.uid}/modules/${moduleId}`);

        // Read-modify-write: fetch current days, splice in new problem.
        return this.getDaysForModule(moduleId).pipe(
          switchMap((days) => {
            const updatedDays = days.map((day) => {
              if (day.id !== dayId) return day;
              return {
                ...day,
                problems: [...(day.problems ?? []), problem],
              };
            });
            return from(updateDoc(moduleRef, { days: updatedDays }));
          }),
        );
      }),
    );
  }

  /**
   * Creates a new Module document in the user's modules collection.
   * Initializes with an empty days array.
   */
  addModule(title: string): Observable<void> {
    return this.authService.user$.pipe(
      switchMap((user) => {
        if (!user) throw new Error('User must be authenticated to add a module.');
        const colRef = this.modulesCol(user.uid);
        const newModuleRef = doc(colRef);
        const module: Module = {
          id: newModuleRef.id,
          title,
          description: '',
          days: [],
        };
        return from(setDoc(newModuleRef, module));
      }),
    );
  }
}

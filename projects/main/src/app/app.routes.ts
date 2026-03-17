import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    children: [
      {
        path: '',
        redirectTo: 'main',
        pathMatch: 'full',
      },
      {
        path: 'main',
        loadComponent: () =>
          import('./pages/queues/queues.component').then(
            (m) => m.QueuesComponent,
          ),
      },
      {
        path: 'module/:mId/day/:dId',
        loadComponent: () =>
          import('./pages/day-view/day-view.component').then(
            (m) => m.DayViewComponent,
          ),
      },
      {
        path: 'module/:mId/day/:dId/new-problem',
        loadComponent: () =>
          import(
            './components/new-submission/new-submission.component'
          ).then((m) => m.NewSubmissionComponent),
      },
    ],
  },
];

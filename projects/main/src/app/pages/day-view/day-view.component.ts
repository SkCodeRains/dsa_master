import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, map } from 'rxjs';
import { DataService } from '../../services/data.service';
import { Day, Problem } from '../../models/dsa-tracker.model';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ConceptTag } from '../../models/dsa-tracker.model';

/** Static concept-tag registry for tooltip content.
 *  In a production app this would be stored in Firestore and fetched lazily. */
export const CONCEPT_TAG_REGISTRY: Record<string, ConceptTag> = {
  'Queue': { name: 'Queue', definition: 'FIFO data structure. Elements enqueued at the back and dequeued from the front.', complexity: 'Enqueue O(1) · Dequeue O(1)' },
  'BFS': { name: 'BFS', definition: 'Breadth-First Search explores nodes level by level using a queue.', complexity: 'O(V + E)' },
  'Sliding Window': { name: 'Sliding Window', definition: 'Maintains a window of elements to reduce nested-loop complexity.', complexity: 'O(N)' },
  'Two Pointers': { name: 'Two Pointers', definition: 'Uses two indices moving toward each other or in the same direction.', complexity: 'O(N)' },
  'Dynamic Programming': { name: 'Dynamic Programming', definition: 'Breaks a problem into overlapping sub-problems and caches solutions.', complexity: 'Varies – typically O(N²)' },
  'Binary Search': { name: 'Binary Search', definition: 'Halves the search space each step on a sorted collection.', complexity: 'O(log N)' },
};

@Component({
  selector: 'app-day-view',
  imports: [
    MatExpansionModule,
    MatChipsModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './day-view.component.html',
  styleUrl: './day-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dataService = inject(DataService);

  readonly moduleId = toSignal(this.route.paramMap.pipe(map((p) => p.get('mId') ?? '')), { initialValue: '' });
  readonly dayId = toSignal(this.route.paramMap.pipe(map((p) => p.get('dId') ?? '')), { initialValue: '' });

  private readonly days = toSignal(
    this.route.paramMap.pipe(
      switchMap((p) => this.dataService.getDaysForModule(p.get('mId') ?? '')),
    ),
    { initialValue: [] as Day[] },
  );

  readonly day = computed<Day | undefined>(() =>
    this.days().find((d) => d.id === this.dayId()),
  );

  readonly problems = computed<Problem[]>(() => this.day()?.problems ?? []);
  readonly summaryTags = computed<string[]>(() => this.day()?.summaryTags ?? []);

  tagTooltip(tagName: string): string {
    const tag = CONCEPT_TAG_REGISTRY[tagName];
    if (!tag) return tagName;
    return `${tag.definition}\n\nComplexity: ${tag.complexity}`;
  }

  navigateToNewProblem(): void {
    this.router.navigate(['/module', this.moduleId(), 'day', this.dayId(), 'new-problem']);
  }

  difficultyClass(difficulty: string): string {
    switch (difficulty) {
      case 'Easy': return 'badge-easy';
      case 'Medium': return 'badge-medium';
      case 'Hard': return 'badge-hard';
      default: return '';
    }
  }
}

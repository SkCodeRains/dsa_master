import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { DataService } from '../../services/data.service';
import { Difficulty, Language } from '../../models/dsa-tracker.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-new-submission',
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatChipsModule,
    MatSelectModule,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './new-submission.component.html',
  styleUrl: './new-submission.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewSubmissionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dataService = inject(DataService);
  protected readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  readonly difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];
  readonly languages: Language[] = ['Python', 'Java', 'TypeScript', 'JavaScript', 'C++'];
  readonly tags = signal<string[]>([]);
  readonly isSubmitting = signal(false);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    difficulty: ['Medium' as Difficulty, Validators.required],
    description: [''],
    approachList: this.fb.array([this.fb.control('')]),
    codeSnippet: [''],
    language: ['Python' as Language, Validators.required],
  });

  get approachControls(): FormControl[] {
    return (this.form.get('approachList') as FormArray).controls as FormControl[];
  }

  addApproachBullet(): void {
    (this.form.get('approachList') as FormArray).push(this.fb.control(''));
  }

  removeApproachBullet(index: number): void {
    const arr = this.form.get('approachList') as FormArray;
    if (arr.length > 1) arr.removeAt(index);
  }

  addTag(event: { value: string; chipInput?: { clear: () => void } }): void {
    const value = (event.value ?? '').trim();
    if (value && !this.tags().includes(value)) {
      this.tags.update((prev) => [...prev, value]);
    }
    event.chipInput?.clear();
  }

  removeTag(tag: string): void {
    this.tags.update((prev) => prev.filter((t) => t !== tag));
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) return;

    const mId = this.route.snapshot.paramMap.get('mId') ?? '';
    const dId = this.route.snapshot.paramMap.get('dId') ?? '';
    const raw = this.form.getRawValue();

    this.isSubmitting.set(true);

    this.dataService
      .addProblem(mId, dId, {
        title: raw.title ?? '',
        difficulty: raw.difficulty as Difficulty,
        tags: this.tags(),
        description: raw.description ?? '',
        approachList: (raw.approachList as string[]).filter(Boolean),
        codeSnippet: raw.codeSnippet ?? '',
        language: raw.language as Language,
      })
      .subscribe({
      next: () => this.router.navigate([
          '/module',
          this.route.snapshot.paramMap.get('mId'),
          'day',
          this.route.snapshot.paramMap.get('dId'),
        ]),
        error: () => this.isSubmitting.set(false),
        complete: () => this.isSubmitting.set(false),
      });
  }
}

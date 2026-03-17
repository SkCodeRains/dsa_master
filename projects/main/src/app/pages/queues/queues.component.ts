import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-queues',
  imports: [MatIconModule],
  templateUrl: './queues.component.html',
  styleUrl: './queues.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueuesComponent {}

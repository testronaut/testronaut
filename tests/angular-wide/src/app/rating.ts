import {
  ChangeDetectionStrategy,
  Component,
  output,
  signal,
} from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-rating',
  styles: `
    .star {
      cursor:pointer;
      font-size:2rem;
    }
  `,
  template: `
    @for (i of ratings; track i) {
    <button class="star" (click)="select(i)">
      {{ selected() >= i ? '★' : '☆' }}
    </button>
    }
  `,
})
export class Rating {
  readonly ratingChange = output<number>();

  protected readonly ratings = [1, 2, 3, 4, 5];
  protected readonly selected = signal<number>(0);

  protected select(rating: number) {
    this.selected.set(rating);
    this.ratingChange.emit(rating);
  }
}

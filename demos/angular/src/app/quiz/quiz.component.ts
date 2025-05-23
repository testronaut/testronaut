import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { QuizStore } from './data/quiz-store';
import { QuizQuestionComponent } from './ui/quiz-question.component';
import { QuizStatusComponent } from './ui/quiz-status.componen';

@Component({
  selector: 'app-quiz',
  template: ` <h2>{{ quizStore.title() }}</h2>
    <app-quiz-status
      [timeLeft]="quizStore.timeLeft()"
      [status]="quizStore.status()"
    />
    @for (question of quizStore.questions(); track question) {
    <app-quiz-question
      [question]="question"
      (answer)="handleAnswer($event)"
    ></app-quiz-question>
    }`,
  imports: [QuizStatusComponent, QuizQuestionComponent],
  providers: [QuizStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizComponent {
  quizStore = inject(QuizStore);
  id = input.required<string>();

  constructor() {
    this.quizStore.setId(computed(() => Number(this.id())));
  }

  handleAnswer($event: { questionId: number; choiceId: number }) {
    this.quizStore.answer($event.questionId, $event.choiceId);
  }
}

export default QuizComponent;

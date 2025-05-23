import {
  computed,
  effect,
  inject,
  Injectable,
  Injector,
  Signal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { Question } from '../model/model';
import { answerQuestion } from './internal/answer-question';
import { calcStatus } from './internal/calc-status';
import { QuizService } from './internal/quiz.service';

@Injectable({ providedIn: 'root' })
export class MyQuizStore {
  // State
  readonly #state = signal({
    title: '',
    questions: [] as Question[],
    timeInSeconds: 60,
    timeStarted: new Date(),
    timeLeft: 0,
    meta: {
      version: '1.0',
      lastUpdated: '2025-05-02',
    },
  });

  //Slices
  readonly title = computed(() => this.#state().title);
  readonly questions = computed(() => this.#state().questions);
  readonly timeInSeconds = computed(() => this.#state().timeInSeconds);
  readonly timeStarted = computed(() => this.#state().timeStarted);
  readonly timeLeft = computed(() => this.#state().timeLeft);
  readonly meta = computed(() => this.#state().meta);
  readonly version = computed(() => this.meta().version);
  readonly lastUpdated = computed(() => this.meta().lastUpdated);

  // Computeds
  readonly status = computed(() => calcStatus(this.questions()));

  // Methods
  readonly #quizService = inject(QuizService);
  readonly #injector = inject(Injector);

  constructor() {
    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        const timeLeft =
          this.timeInSeconds() -
          Math.floor((Date.now() - this.timeStarted().getTime()) / 1000);

        this.#state.update((value) => ({ ...value, timeLeft }));
      });
  }

  setId(id: Signal<number>) {
    effect(
      async () => {
        const quiz = await this.#quizService.findById(id());
        this.#state.update((value) => ({ ...value, ...quiz }));
      },
      { injector: this.#injector },
    );
  }

  answer(questionId: number, answerId: number) {
    this.#state.update((value) => ({
      ...value,
      questions: answerQuestion(this.questions(), questionId, answerId),
    }));
  }
}

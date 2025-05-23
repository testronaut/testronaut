import { computed, inject } from '@angular/core';
import {
  patchState,
  signalMethod,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { interval, pipe, switchMap } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Question } from '../model/model';
import { answerQuestion } from './internal/answer-question';
import { calcStatus } from './internal/calc-status';
import { QuizService } from './internal/quiz.service';

export const QuizStore = signalStore(
  withState({
    title: '',
    questions: [] as Question[],
    timeInSeconds: 60,
    timeStarted: new Date(),
    timeLeft: 0,
  }),

  withMethods((store) => {
    const quizService = inject(QuizService);
    return {
      setId: rxMethod<number>(
        pipe(
          switchMap((holidayId) => quizService.findById(holidayId)),
          tap((quiz) => patchState(store, quiz)),
        ),
      ),

      updateTime: signalMethod(() =>
        patchState(store, {
          timeLeft:
            store.timeInSeconds() -
            Math.floor(
              (new Date().getTime() - store.timeStarted().getTime()) / 1000,
            ),
        }),
      ),

      answer(questionId: number, answerId: number) {
        patchState(store, {
          questions: answerQuestion(store.questions(), questionId, answerId),
        });
      },
    };
  }),

  withComputed(({ questions }) => ({
    status: computed(() => calcStatus(questions())),
  })),

  withHooks((store) => ({
    onInit() {
      store.updateTime(interval(1000));
    },
  })),
);

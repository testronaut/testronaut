import { defer, Observable } from 'rxjs';
import { QuizService, toQuiz } from '../data/internal/quiz.service';
import { Quiz } from '../model/model';
import { createQuiz } from './create-quiz';

type Public<T> = { [Key in keyof T]: T[Key] };

function throwIfUndefined<T>(value: T): NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error('value is undefined');
  }

  return value;
}

export class QuizFake implements Public<QuizService> {
  #quizzes: Quiz[] = [toQuiz(createQuiz(1), 1)];
  setQuizzes(quizzes: Quiz[]) {
    this.#quizzes = quizzes;
  }

  findById(id: number): Observable<Quiz> {
    return defer(async () =>
      throwIfUndefined(this.#quizzes.find((quiz) => quiz.id === id))
    );
  }
}

export function provideQuizFake() {
  return [QuizFake, { provide: QuizService, useExisting: QuizFake }];
}

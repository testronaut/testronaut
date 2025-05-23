import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { screen, within } from '@testing-library/angular';
import { QuizStore } from '../data/quiz-store';
import { QuizComponent } from '../quiz.component';
import { createQuiz } from './create-quiz';

describe('Quiz Feature', () => {
  fit('should show correct status', async () => {
    TestBed.configureTestingModule({
      imports: [QuizComponent],
      providers: [
        provideExperimentalZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        QuizStore,
      ],
    });

    const fixture = TestBed.createComponent(QuizComponent);
    fixture.componentRef.setInput('id', 1);
    fixture.autoDetectChanges(true);
    await fixture.whenStable();

    const ctrl = TestBed.inject(HttpTestingController);
    ctrl.expectOne('/holiday/1/quiz').flush(createQuiz(1));

    await fixture.whenStable();

    // screen.getByRole
    const question = screen
      .getAllByLabelText('question')
      .find((question) => within(question).getByText(/programming language/));
    if (!question) {
      throw new Error();
    }
    within(question).getByRole('button', { name: 'TypeScript' }).click();

    await fixture.whenStable();
    expect(screen.getByText('Correct: 1')).toBeDefined();
  });
});

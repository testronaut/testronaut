import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { expect, test } from '@testronaut/angular';
import QuizComponent from './quiz.component';
import { provideQuizFake } from './tests/provide-quiz-fake';

test.describe('Quiz Feature', () => {
  test('should show correct status', async ({ page, runInBrowser, mount }) => {
    await runInBrowser('setup', () => {
      TestBed.configureTestingModule({
        providers: [
          provideNoopAnimations(),
          provideQuizFake(),
          provideExperimentalZonelessChangeDetection(),
        ],
      });
    });

    await mount(QuizComponent, { inputs: { id: '1' } });

    await page
      .getByLabel('question')
      .filter({ hasText: /programming language/ })
      .getByRole('button', { name: 'TypeScript' })
      .click();

    await expect(page.getByText('Correct: 1')).toBeVisible();
  });
});

import { QuizApi } from '../data/internal/quiz.service';

export function createQuiz(holidayId: number): QuizApi {
  return {
    id: holidayId,
    title: 'Angular Quiz',
    timeInSeconds: 280,
    questions: [
      {
        id: 1,
        question: 'What programming language is Angular written in?',
        answers: [
          { id: 1, answer: 'JavaScript', isCorrect: false },
          { id: 2, answer: 'TypeScript', isCorrect: true },
          { id: 3, answer: 'Java', isCorrect: false },
          { id: 4, answer: 'Python', isCorrect: false },
        ],
        explanation: 'Angular was the first framework written in TypeScript.',
      },
      {
        id: 2,
        question: 'Which framework was released after AngularJS?',
        answers: [
          { id: 5, answer: 'Vue', isCorrect: false },
          { id: 6, answer: 'React', isCorrect: false },
          { id: 7, answer: 'Svelte', isCorrect: false },
          { id: 8, answer: 'All', isCorrect: true },
        ],
        explanation:
          'AngularJS started in 2010, React in 2013, and Vue in 2014.',
      },
    ],
  };
}

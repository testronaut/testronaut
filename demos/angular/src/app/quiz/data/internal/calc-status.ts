import { AnswerStatus, Question } from '../../model/model';

export function calcStatus(questions: Question[]) {
  const status: Record<AnswerStatus, number> = {
    unanswered: 0,
    correct: 0,
    incorrect: 0,
  };

  for (const question of questions) {
    status[question.status]++;
  }

  return status;
}

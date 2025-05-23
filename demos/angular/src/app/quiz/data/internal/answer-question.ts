import { assertDefined } from '../../../shared/util/assert-defined';
import { AnswerStatus, Question } from '../../model/model';

export function answerQuestion(
  questions: Question[],
  questionId: number,
  answerId: number
): Question[] {
  const question = questions.find((question) => question.id === questionId);
  assertDefined(question);

  return questions.map((question) => {
    if (question.id === questionId) {
      const status: AnswerStatus =
        question.answer === answerId ? 'correct' : 'incorrect';
      return {
        ...question,
        status,
      };
    } else {
      return question;
    }
  });
}

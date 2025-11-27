import { Component, EventEmitter, Output, output } from '@angular/core';
import { expectTypeOf, test } from 'vitest';
import { type Fixtures } from './fixtures';

const fixtures = null as unknown as Fixtures;

test('mount derives output types from the component', async () => {
  const { outputs } = await fixtures.mount(Rating);

  expectTypeOf(outputs).toEqualTypeOf<{
    ratingChange: {
      calls: number[];
    };
  }>();
});

test('mount derives output types from the component even with dynamically imported component', async () => {
  const { outputs } = await fixtures.mount(() => Promise.resolve(Rating));

  expectTypeOf(outputs).toEqualTypeOf<{
    ratingChange: {
      calls: number[];
    };
  }>();
});

test('mount derives output types from the component even with named mount', async () => {
  const { outputs } = await fixtures.mount('rating', Rating);

  expectTypeOf(outputs).toEqualTypeOf<{
    ratingChange: {
      calls: number[];
    };
  }>();
});

test('mount derives output types from the component even with dynamically imported component and named mount', async () => {
  const { outputs } = await fixtures.mount('rating', () =>
    Promise.resolve(Rating)
  );

  expectTypeOf(outputs).toEqualTypeOf<{
    ratingChange: {
      calls: number[];
    };
  }>();
});

test('mount derives legacy output types from the component', async () => {
  const { outputs } = await fixtures.mount(RatingLegacy);

  expectTypeOf(outputs).toEqualTypeOf<{
    ratingChange: {
      calls: number[];
    };
  }>();
});

@Component({})
class Rating {
  ratingChange = output<number>();
}

@Component({})
class RatingLegacy {
  @Output() ratingChange = new EventEmitter<number>();
}

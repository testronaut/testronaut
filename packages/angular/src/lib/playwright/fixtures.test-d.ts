import { Component, output } from '@angular/core';
import { expectTypeOf, test } from 'vitest';
import { type Fixtures } from './fixtures';

const fixtures = null as unknown as Fixtures;

test('mount derives output types from the component', async () => {
  @Component({})
  class Rating {
    ratingChange = output<number>();
  }

  const { outputs } = await fixtures.mount(Rating);

  expectTypeOf(outputs).toEqualTypeOf<{
    ratingChange: {
      calls: number[];
    };
  }>();
});

test('mount derives output types from the component even with named mount', async () => {
  @Component({})
  class Rating {
    ratingChange = output<number>();
  }

  const { outputs } = await fixtures.mount('rating', Rating);

  expectTypeOf(outputs).toEqualTypeOf<{
    ratingChange: {
      calls: number[];
    };
  }>();
});

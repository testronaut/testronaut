import { Component, computed, signal } from '@angular/core';

@Component({
  template: `
    @for (product of products(); track product) {
    <div>
      <p>{{ product.name }} ({{ product.price }} EUR)</p>
      <button (click)="addProduct(product.id)">+</button>
      <button (click)="removeProduct(product.id)">-</button>
    </div>
    }

    <p class="text-bold">Total: {{ total() }} EUR</p>
  `,
})
export class BasketComponent {
  protected readonly products = signal([
    { id: 1, name: 'Apple', price: 1.99 },
    { id: 2, name: 'Water', price: 0.69 },
    { id: 3, name: 'Bread', price: 4.2 },
  ]);

  protected readonly basket = signal<Record<number, number>>({});

  protected readonly total = computed(() => {
    const products = this.products();

    return Object.entries(this.basket())
      .reduce((sum, [id, amount]) => {
        const product = products.find((product) => product.id === Number(id));
        if (!product) {
          return sum;
        }
        return amount * product.price + sum;
      }, 0)
      .toFixed(2);
  });

  protected addProduct(id: number) {
    this.basket.update((value) => ({ ...value, [id]: (value[id] ?? 0) + 1 }));
  }

  protected removeProduct(id: number) {
    this.basket.update((value) => {
      const currentAmount = value[id] ?? 0;
      if (currentAmount === 0) {
        return value;
      }

      return { ...value, [id]: currentAmount - 1 };
    });
  }
}

export default BasketComponent;

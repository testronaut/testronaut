import { Component, computed, signal } from '@angular/core';

@Component({
  template: `
    <div class="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
      @for(product of productsWithAmount(); track product.id) {
      <div class="flex items-center justify-between p-2 border-b">
        <p class="text-lg font-medium">
          {{ product.name }} ({{ product.price }} EUR)
        </p>
        <div>
          <button
            (click)="removeProduct(product.id)"
            class="px-2 py-1 bg-red-500 text-white rounded"
          >
            -
          </button>
          {{ product.amount }}
          <button
            (click)="addProduct(product.id)"
            class="px-2 py-1 bg-green-500 text-white rounded"
          >
            +
          </button>
        </div>
      </div>
      }
      <p class="text-xl font-bold text-right">Total: {{ total() }} EUR</p>
    </div>
  `,
})
export class BasketComponent {
  protected readonly products = [
    { id: 1, name: 'Apple', price: 1.99 },
    { id: 2, name: 'Water', price: 0.69 },
    { id: 3, name: 'Bread', price: 4.2 },
  ];

  protected readonly basket = signal<Record<number, number>>({});

  protected readonly productsWithAmount = computed(() => {
    const basket = this.basket();

    return this.products.map((product) => ({
      ...product,
      amount: basket[product.id] ?? 0,
    }));
  });

  protected readonly total = computed(() => {
    return Object.entries(this.basket())
      .reduce((sum, [id, amount]) => {
        const product = this.products.find(
          (product) => product.id === Number(id)
        );
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

  trackByProduct(index: number, product: any) {
    return product.id;
  }
}

export default BasketComponent;

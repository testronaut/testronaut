---
sidebar_position: 1
---

# Welcome!

Modern frontend frameworks provide powerful tools for building components—but testing them is often a different story.

In most setups, component tests are written using tools like **Jest** or **Vitest**, running in a simulated DOM. But this approach has major drawbacks:

- You **can’t see what the component looks like**—it’s all virtual.
- You need to **manually manage asynchronous tasks**.
- Framework-specific quirks get in the way:
  - In **Angular**, for instance, you need to manually trigger **change detection**.
  - DOM events often need to be **dispatched by hand**, which adds unnecessary complexity and can introduce errors.

## Meet Testronaut

**Testronaut** is a new approach to Angular component testing. It runs your components in a **real browser**, using Angular’s own build process. That means:

- Components behave exactly as they do in production.
- You can **visually debug** and inspect rendered output.
- You write tests using **Playwright’s powerful API**, scoped to just the component.

No mocks. No guesswork. Just real behavior.

## Full Runtime Access

Sometimes you need to go beyond rendering:

- Programmatically **instantiate and configure components**.
- **Access services** via Angular’s Dependency Injection.
- Run logic **directly in the browser context**.

Testronaut enables this without sacrificing test readability or stability.

## How It Works

At its core, Testronaut provides:

- **Code extraction** – identifying and isolating test code that should run inside the browser.
- **Context injection** – transferring that code into the browser for live execution.
- **Precise synchronization** – keeping the test runner and browser environment in sync.

The result is a **stable, visual, and framework-aware testing experience** that feels closer to real usage—without the overhead of full E2E tests.

---

Welcome to Testronaut. Let’s explore a better way to test components.

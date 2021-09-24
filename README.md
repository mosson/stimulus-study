Stimulus Study
===

[stimulus-rails](https://github.com/hotwired/stimulus-rails) のコンセプトがCustomElementのconnect/disconnectのライフサイクルをヒントにしていると目にしたので、MutationObserverを使って同じようなものを素振りしてつくってみたもの。

## example

```html
<!-- HTML -->
<div data-controller="hello">
  <input data-hello-target="name" type="text">

  <button data-action="click->hello#greet">
    Greet
  </button>

  <span data-hello-target="output">
  </span>
</div>
```

```typescript
import { LikeStimulus } from 'src/like-stimulus';
const app = new LikeStimulus(container);
app.register(
  "hello",
  class extends Controller {
    static targets = ["name", "output"];
    private outputTarget: HTMLElement | undefined;
    private nameTarget: HTMLInputElement | undefined;

    greet() {
      if (!this.outputTarget) return;
      if (!this.nameTarget) return;
      this.outputTarget.textContent = `Hello, ${this.nameTarget.value}!`;
    }
  }
);
```
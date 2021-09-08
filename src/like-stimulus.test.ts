import { Controller, LikeStimulus } from "./like-stimulus";

let container: HTMLDivElement | null = null;
beforeEach(() => {
  // setup a DOM element as a render target
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  // cleanup on exiting
  if (container) container.remove();
  container = null;
});

it("behaviors like stimulus", async () => {
  if (!container) throw new Error("container missing");

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

  container.innerHTML = `
    <div data-controller="hello">
      <input data-hello-target="name" type="text">

      <button data-action="click->hello#greet">
        Greet
      </button>

      <span data-hello-target="output">
      </span>
    </div>
  `;

  await (function(){
    return new Promise((resolve) => {
      setTimeout(resolve, 20);
    })
  }());

  const input = container.querySelector("input");
  const button = container.querySelector('button');

  expect(container.textContent?.replace(/\s/g, '')).toBe('Greet');

  if (input) {
    input.value = "mosson";
  }
  if(button) {
    button.dispatchEvent(new MouseEvent('click'));
  }

  expect(container.textContent?.replace(/\s/g, '')).toBe('GreetHello,mosson!');
});

import { LikeStimulus } from "./like-stimulus";
import { ExampleController } from "./example-controller";

const rootElement: HTMLElement | null = document.getElementById("root");
if (rootElement) {
  const app: LikeStimulus = new LikeStimulus(rootElement);
  app.register("example", ExampleController);

  reset();
}

function reset() {
  if (!rootElement) return;
  while (rootElement.firstChild && rootElement.lastChild) {
    rootElement.removeChild(rootElement.lastChild);
  }

  setTimeout(() => {
    const divElement: HTMLDivElement = document.createElement("div");
    divElement.innerHTML = `
      <div data-controller="example">
        <button type="button" data-action="click->example#increment">
          Increment Count
        </button>
        <p data-example-target="display"></p>
      </div>

      <div data-controller="example">
        <button type="button" data-action="click->example#increment">
          Increment Count
        </button>
        <p data-example-target="display"></p>
      </div>
    `;

    rootElement.appendChild(divElement);

    const clearButton = document.createElement("button");
    clearButton.textContent = "reset";
    const cb = () => {
      clearButton.removeEventListener("click", cb);
      reset();
    };
    clearButton.addEventListener("click", cb);
    rootElement.appendChild(clearButton);
  });
}

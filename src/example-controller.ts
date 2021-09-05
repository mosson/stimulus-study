import { Controller } from "./like-stimulus";

export class ExampleController implements Controller {
  static targets = ["display"];

  public node: HTMLElement;
  private count: number;

  public displayTarget: HTMLElement | undefined;

  constructor(node: HTMLElement) {
    this.node = node;
    this.count = 0;
  }

  connect() {
    console.log("connected");
    this.node.style.backgroundColor = "red";
    this.refreshDisplay();
  }

  refreshDisplay() {
    if (this.displayTarget) {
      this.displayTarget.textContent = this.count.toString();
    }
  }

  increment(e: Event) {
    console.log('incremnt');
    this.count++; // // always binded controller
    this.refreshDisplay();
  }

  disconnect() {
    console.log("disconnected");
  }
}

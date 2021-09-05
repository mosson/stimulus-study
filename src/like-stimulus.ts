export interface ControllerCtor {
  new (rootNode: HTMLElement): Controller;
  targets: string[];
}

export interface Controller {
  node: HTMLElement;
  connect(): void;
  disconnect(): void;
}

// ユーザーコードではControllerをextendsした何かが定義されるため
// イベントを処理するメソッドは不明。インデックスシグネチャでのアクセス
// が弾かれるためやむなくこういう回避方法にした。
function isControllerProperty(
  instance: Controller,
  keyName: string
): keyName is keyof Controller {
  if (!instance) return false;
  return keyName in instance;
}

export class LikeStimulus {
  private ctors: { [className: string]: ControllerCtor };
  private instances: { [className: string]: Controller[] };
  private observer: MutationObserver;

  constructor(root: HTMLElement) {
    this.ctors = {};
    this.instances = {};
    this.onMutate = this.onMutate.bind(this);
    this.addHandle = this.addHandle.bind(this);
    this.removeHandle = this.removeHandle.bind(this);
    this.observer = new MutationObserver(this.onMutate);
    this.observer.observe(root, {
      attributes: false,
      childList: true,
      subtree: true,
    });
  }

  public register(className: string, ctor: ControllerCtor) {
    if (this.ctors[className])
      throw new Error(`${className} is already registered.`);
    this.ctors[className] = ctor;
  }

  private find(
    className: string,
    rootNode: HTMLElement
  ): Controller | undefined {
    return this.instancesOf(className).find(
      (instance) => instance.node === rootNode
    );
  }

  private instancesOf(className: string): Controller[] {
    if (!this.instances[className]) this.instances[className] = [];
    return this.instances[className];
  }

  private addHandle(node: Node, key: number, parent: NodeList) {
    if (!(node instanceof HTMLElement)) return;
    const nodes: NodeListOf<HTMLElement> =
      node.querySelectorAll<HTMLElement>("[data-controller]");
    for (let i = 0; i < nodes.length; i++) {
      const targetNode = nodes[i];
      if (!targetNode) continue;
      const className: string | undefined = targetNode.dataset?.controller;
      if (!className) return;

      const controllerCtor: ControllerCtor = this.ctors[className];
      if (!controllerCtor) return;

      if (this.find(className, targetNode)) continue;

      const instance: Controller = new controllerCtor(targetNode);
      this.instancesOf(className).push(instance);
      this.hydrate(className, targetNode);
      instance.connect();
    }
  }

  removeHandle(node: Node, key: number, parent: NodeList) {
    if (!(node instanceof HTMLElement)) return;
    const nodes: NodeListOf<HTMLElement> =
      node.querySelectorAll<HTMLElement>("[data-controller]");
    for (let i = 0; i < nodes.length; i++) {
      const targetNode = nodes[i];
      const className = targetNode.dataset?.controller;
      if (!className) return;

      const index: number = this.instancesOf(className).findIndex(
        (controller) => controller.node === targetNode
      );

      if (index >= 0) {
        const instance = this.instancesOf(className)[index];
        instance.disconnect();
        this.dehydrate(className, targetNode);
        this.instances[className] = [
          ...this.instances[className].slice(0, index),
          ...this.instances[className].slice(index + 1),
        ];
      }
    }
  }

  // implements MutationCallback
  private onMutate(mutationList: MutationRecord[], observer: MutationObserver) {
    mutationList.forEach((listItem) => {
      listItem.addedNodes?.forEach(this.addHandle);
      listItem.removedNodes?.forEach(this.removeHandle);
    });
  }

  private hydrate(className: string, node: HTMLElement) {
    const instance = this.find(className, node);
    if (!instance) return;

    // subscribe actions
    let nodes: NodeListOf<HTMLElement> =
      node.querySelectorAll<HTMLElement>("[data-action]");
    for (let i = 0; i < nodes.length; i++) {
      const element: HTMLElement = nodes[i];
      const [eventName, ...rest] = (element.dataset.action || "").split("->");
      const [controllerName, ...actions] = rest?.join("").split("#");
      if (controllerName !== className) continue;

      const actionName: string = actions.join("");
      if (!actionName) continue;

      if (!isControllerProperty(instance, actionName)) continue;
      const method = instance[actionName];

      if (typeof method !== "function") continue;
      element.addEventListener(eventName, method.bind(instance));
    }

    // assign targets for accessable from user code
    this.ctors[className].targets.forEach((targetKey) => {
      const nodes: NodeListOf<HTMLElement> = node.querySelectorAll<HTMLElement>(
        `[data-${className}-target="${targetKey}"]`
      );
      for (let i = 0; i < nodes.length; i++) {
        const element: HTMLElement = nodes[i];
        const targetName = `${targetKey}Target`;
        if (!isControllerProperty(instance, targetName)) continue;
        Object.assign(instance, { [targetName]: element });
      }
    });
  }

  private dehydrate(className: string, node: HTMLElement) {
    const instance: Controller | undefined = this.find(className, node);
    if (!instance) return;

    // unsubscribe actions for memory leaking
    const nodes: NodeListOf<HTMLElement> =
      node.querySelectorAll<HTMLElement>("[data-action]");
    for (let i = 0; i < nodes.length; i++) {
      const element: HTMLElement = nodes[i];
      const [eventName, ...rest] = (element.dataset.action || "").split("->");
      const [controllerName, ...actions] = rest?.join("").split("#");
      if (controllerName !== className) continue;

      const actionName: string = actions.join("");
      if (!isControllerProperty(instance, actionName)) continue;

      const method = instance[actionName];
      if (typeof method !== "function") continue;
      element.removeEventListener(eventName, method);
    }
  }
}
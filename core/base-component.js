export class BaseComponent {
  constructor() {
    this.element = null;
    this.state = {};
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  render() {
    throw new Error("Método render deve ser implementado");
  }

  mount(container) {
    if (!this.element) {
      this.render();
    }
    container.appendChild(this.element);
  }

  unmount() {
    this.element?.remove();
  }

  createElement(tag, className = "", content = "") {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.innerHTML = content;
    return element;
  }
}

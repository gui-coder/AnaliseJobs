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
    // To be implemented by child classes
  }

  onActivate() {
    // To be implemented by child classes
  }

  destroy() {
    this.element?.remove();
  }
}

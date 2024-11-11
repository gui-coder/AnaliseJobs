import { BaseComponent } from "../../core/base-component.js";
import { MENU_ITEMS, EVENTS } from "../../utils/constants.js";
import "./sidebar.css";

export class Sidebar extends BaseComponent {
  constructor(eventEmitter) {
    super();
    this.eventEmitter = eventEmitter;
    this.activeRoute = null;
    this.render();
    this.bindEvents();
  }

  render() {
    this.element = this.createElement("div", "sidebar");
    this.element.innerHTML = `
            <div class="sidebar-header">
                <h5>Menu</h5>
                <button class="sidebar-close">×</button>
            </div>
            <nav class="sidebar-nav">
                ${this.renderMenuItems()}
            </nav>
        `;
  }

  renderMenuItems() {
    return MENU_ITEMS.map(
      (item) => `
            <a href="#${item.id}" 
               class="sidebar-item ${
                 this.activeRoute === item.id ? "active" : ""
               }"
               data-route="${item.id}">
                <i class="${item.icon}"></i>
                <span>${item.label}</span>
            </a>
        `
    ).join("");
  }

  bindEvents() {
    this.element.addEventListener("click", (e) => {
      const item = e.target.closest(".sidebar-item");
      if (item) {
        e.preventDefault();
        const route = item.dataset.route;
        this.setActive(route);
        this.eventEmitter.emit(EVENTS.NAVIGATION, route);
      }
    });
  }

  setActive(route) {
    this.activeRoute = route;
    this.render();
  }
}

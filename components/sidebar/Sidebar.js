import { MENU_ITEMS } from "../../utils/constants.js";

export class Sidebar {
  constructor(onNavigate) {
    this.element = null;
    this.onNavigate = onNavigate;
    this.activeRoute = null;
    this.init();
  }

  init() {
    this.element = this.createSidebar();
    this.bindEvents();
  }

  createSidebar() {
    const sidebar = document.createElement("div");
    sidebar.className = "sidebar";
    sidebar.innerHTML = this.getTemplate();
    return sidebar;
  }

  getTemplate() {
    return `
            <div class="sidebar-header">
                <h5>Menu</h5>
                <button class="btn-close" id="closeSidebar"></button>
            </div>
            <nav class="sidebar-nav">
                ${this.getMenuItemsTemplate()}
            </nav>
        `;
  }

  getMenuItemsTemplate() {
    return MENU_ITEMS.map(
      (item) => `
            <a href="#${item.id}" 
               class="nav-link ${this.activeRoute === item.id ? "active" : ""}"
               data-route="${item.id}">
                <i class="${item.icon}"></i>
                <span>${item.label}</span>
            </a>
        `
    ).join("");
  }

  bindEvents() {
    this.element.addEventListener("click", (e) => {
      const link = e.target.closest(".nav-link");
      if (link) {
        e.preventDefault();
        const route = link.dataset.route;
        this.setActive(route);
        this.onNavigate(route);
      }
    });

    const closeBtn = this.element.querySelector("#closeSidebar");
    closeBtn?.addEventListener("click", () => this.toggleSidebar(false));
  }

  setActive(route) {
    this.activeRoute = route;
    this.element.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.toggle("active", link.dataset.route === route);
    });
  }

  toggleSidebar(show) {
    this.element.classList.toggle("show", show);
  }
}

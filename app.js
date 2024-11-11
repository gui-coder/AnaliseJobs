import { Sidebar } from "./components/Sidebar/Sidebar.js";
import { Dashboard } from "./components/Dashboard/Dashboard.js";
import { Overdue } from "./components/Overdue/Overdue.js";
import { History } from "./components/History/History.js";
import { ROUTES } from "./utils/constants.js";

class App {
  constructor() {
    this.components = {};
    this.currentRoute = null;
    this.init();
  }

  init() {
    this.initializeComponents();
    this.setupRouter();
    this.bindEvents();
  }

  initializeComponents() {
    // Inicializa a sidebar
    this.components.sidebar = new Sidebar((route) => this.navigateTo(route));

    // Inicializa os componentes de conteúdo
    this.components.dashboard = new Dashboard();
    this.components.overdue = new Overdue();
    this.components.history = new History();

    // Monta a estrutura inicial
    const appContainer = document.getElementById("app");
    appContainer.appendChild(this.components.sidebar.element);

    // Cria o container principal
    const mainContent = document.createElement("main");
    mainContent.id = "mainContent";
    mainContent.className = "main-content";
    appContainer.appendChild(mainContent);
  }

  setupRouter() {
    // Lida com a navegação inicial
    window.addEventListener("hashchange", () => this.handleRoute());
    this.handleRoute();
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || ROUTES.DASHBOARD;
    this.navigateTo(hash);
  }

  navigateTo(route) {
    // Remove conteúdo atual
    const mainContent = document.getElementById("mainContent");
    mainContent.innerHTML = "";

    // Atualiza rota atual
    this.currentRoute = route;

    // Atualiza sidebar
    this.components.sidebar.setActive(route);

    // Monta novo componente
    const component = this.getComponentForRoute(route);
    if (component?.element) {
      mainContent.appendChild(component.element);
    }

    // Atualiza URL
    window.location.hash = route;
  }

  getComponentForRoute(route) {
    const componentMap = {
      [ROUTES.DASHBOARD]: this.components.dashboard,
      [ROUTES.OVERDUE]: this.components.overdue,
      [ROUTES.HISTORY]: this.components.history,
    };
    return componentMap[route];
  }

  bindEvents() {
    // Toggle sidebar no mobile
    const sidebarToggle = document.createElement("button");
    sidebarToggle.id = "sidebarToggle";
    sidebarToggle.className = "btn btn-light d-md-none";
    sidebarToggle.innerHTML = '<i class="fas fa-bars"></i>';

    sidebarToggle.addEventListener("click", () => {
      this.components.sidebar.toggleSidebar(true);
    });

    document.body.appendChild(sidebarToggle);
  }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});

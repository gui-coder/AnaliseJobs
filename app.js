import { EventEmitter } from "./core/event-emitter.js";
import { Sidebar } from "./components/sidebar/sidebar.js";
import { Dashboard } from "./components/dashboard/dashboard.js";
import { Overdue } from "./components/overdue/overdue.js";
import { History } from "./components/history/history.js";
import { EasyCRQ } from "./components/easy-crq/easy-crq.js";
import { ROUTES, EVENTS } from "./utils/constants.js";

class App {
  constructor() {
    this.eventEmitter = new EventEmitter();
    this.components = {};
    this.currentRoute = ROUTES.DASHBOARD;
    this.init();
  }

  init() {
    this.initComponents();
    this.bindEvents();
    this.handleRoute();
  }

  initComponents() {
    // Inicializa componentes
    this.components = {
      sidebar: new Sidebar(this.eventEmitter),
      dashboard: new Dashboard(this.eventEmitter),
      overdue: new Overdue(this.eventEmitter),
      history: new History(this.eventEmitter),
      easyCrq: new EasyCRQ(this.eventEmitter),
    };

    // Monta a sidebar
    this.components.sidebar.mount(document.getElementById("app"));

    // Cria container para o conteúdo principal
    const mainContainer = document.createElement("main");
    mainContainer.id = "main-content";
    document.getElementById("app").appendChild(mainContainer);
  }

  bindEvents() {
    // Navegação
    this.eventEmitter.on(EVENTS.NAVIGATION, (route) => {
      this.navigateTo(route);
    });

    // Monitora mudanças na URL
    window.addEventListener("popstate", () => this.handleRoute());
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || ROUTES.DASHBOARD;
    this.navigateTo(hash);
  }

  navigateTo(route) {
    // Remove componente atual
    const mainContainer = document.getElementById("main-content");
    mainContainer.innerHTML = "";

    // Monta novo componente
    const component = this.getComponentForRoute(route);
    if (component) {
      component.mount(mainContainer);
      this.components.sidebar.setActive(route);
      this.currentRoute = route;
      window.location.hash = route;
    }
  }

  getComponentForRoute(route) {
    const componentMap = {
      [ROUTES.DASHBOARD]: this.components.dashboard,
      [ROUTES.OVERDUE]: this.components.overdue,
      [ROUTES.HISTORY]: this.components.history,
      [ROUTES.EASY_CRQ]: this.components.easyCrq,
    };
    return componentMap[route];
  }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});

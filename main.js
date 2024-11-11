import { Sidebar } from "./components/Sidebar/Sidebar.js";
import { NAVIGATION } from "./utils/constants.js";

class App {
  constructor() {
    this.state = {
      currentSection: NAVIGATION.DASHBOARD,
    };
    this.components = {};
    this.init();
  }

  init() {
    this.initializeSidebar();
    this.bindEvents();
  }

  initializeSidebar() {
    this.components.sidebar = new Sidebar({
      onNavigate: (section) => this.navigateToSection(section),
    });
    document.getElementById("app").appendChild(this.components.sidebar.element);
  }

  navigateToSection(section) {
    this.state.currentSection = section;
    console.log(`Navegando para: ${section}`);
    // Implementar lógica de navegação
  }

  bindEvents() {
    // Implementar eventos globais
  }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});

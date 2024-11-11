import { BaseComponent } from "../BaseComponent.js";
import "./dashboard.css";

export class Dashboard extends BaseComponent {
  constructor() {
    super();
    this.state = {
      data: null,
      loading: false,
    };
    this.init();
  }

  init() {
    this.element = document.createElement("section");
    this.element.className = "dashboard-section";
    this.render();
  }

  render() {
    this.element.innerHTML = `
            <div class="container py-4">
                <h2>Dashboard</h2>
                ${
                  this.state.loading
                    ? this.getLoadingTemplate()
                    : this.getContentTemplate()
                }
            </div>
        `;
  }

  getLoadingTemplate() {
    return `
            <div class="text-center py-5">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
  }

  getContentTemplate() {
    // Implement dashboard content template
    return `
            <div class="row">
                <!-- Dashboard content -->
            </div>
        `;
  }

  async onActivate() {
    this.setState({ loading: true });
    try {
      // Fetch dashboard data
      const data = await this.fetchDashboardData();
      this.setState({ data, loading: false });
    } catch (error) {
      console.error("Error loading dashboard:", error);
      this.setState({ loading: false });
    }
  }

  async fetchDashboardData() {
    // Implement data fetching
  }
}

export const EVENTS = {
  NAVIGATION: "navigation",
  THEME_CHANGE: "theme_change",
  FILE_UPLOAD: "file_upload",
};

export const ROUTES = {
  DASHBOARD: "dashboard",
  OVERDUE: "overdue",
  HISTORY: "history",
  EASY_CRQ: "easy-crq",
};

export const MENU_ITEMS = [
  {
    id: ROUTES.DASHBOARD,
    label: "Dashboard",
    icon: "fas fa-chart-bar",
  },
  {
    id: ROUTES.OVERDUE,
    label: "Overdue",
    icon: "fas fa-clock",
  },
  {
    id: ROUTES.HISTORY,
    label: "Histórico",
    icon: "fas fa-history",
  },
  {
    id: ROUTES.EASY_CRQ,
    label: "Easy CRQ",
    icon: "fas fa-wrench",
  },
];

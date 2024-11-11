export const ROUTES = {
  DASHBOARD: "dashboard",
  OVERDUE: "overdue",
  HISTORY: "history",
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
];

export const FILE_TYPES = {
  EXCEL: ".xlsx,.xls",
  ACCEPTED_MIME_TYPES: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ],
};

export const ROUTES = {
  landing: "/",
  login: "/login",
  signup: "/signup",
  profile: "/profile",
  dashboard: "/dashboard",
  tracker: "/tracker",
  simulator: "/simulator",
  recommendations: "/recommendations",
  challenges: "/challenges",
  reports: "/reports",
  leaderboard: "/leaderboard",
  settings: "/settings",
};

export const SIDEBAR_ITEMS = [
  { label: "Dashboard", href: ROUTES.dashboard, icon: "LayoutDashboard" },
  { label: "Activity Tracker", href: ROUTES.tracker, icon: "CalendarRange" },
  { label: "Carbon Simulator", href: ROUTES.simulator, icon: "Cpu" },
  { label: "AI Recommendations", href: ROUTES.recommendations, icon: "Sparkles" },
  { label: "Eco Challenges", href: ROUTES.challenges, icon: "Trophy" },
  { label: "Analytics Reports", href: ROUTES.reports, icon: "TrendingUp" },
  { label: "Leaderboard", href: ROUTES.leaderboard, icon: "Medal" },
  { label: "Settings", href: ROUTES.settings, icon: "Settings" },
];

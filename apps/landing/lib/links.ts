export const dashboardLoginUrl = new URL(
  '/login',
  process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://reporty-extension.vercel.app',
).toString();

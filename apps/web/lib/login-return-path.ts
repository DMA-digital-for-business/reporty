import { isUuid } from '@reporty/shared';
import { oauthReturnPath } from './mcp/return-path';

export const reportReturnCookie = 'reporty_report_after_login';

export function reportDashboardPath(projectId: string, reportId: string): string {
  return `/dashboard/projects/${projectId}?report=${reportId}`;
}

export function reportReturnPath(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = /^\/dashboard\/projects\/([^/?]+)\?report=([^&]+)$/.exec(value);
  if (!match || !isUuid(match[1]) || !isUuid(match[2])) return null;
  return reportDashboardPath(match[1], match[2]);
}

export function loginReturnPath(value: unknown): string | null {
  return reportReturnPath(value) ?? oauthReturnPath(value);
}

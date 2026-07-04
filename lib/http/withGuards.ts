import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireAdmin, requireUser } from "@/lib/auth/session";
import { AUTH_COOKIE_CSRF } from "@/lib/auth/config";
import { logger } from "@/lib/log";
import { checkRateLimit } from "@/lib/http/rateLimit";

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

export function apiError(code: string, message: string, status: number, requestId: string) {
  return NextResponse.json<ApiErrorBody>(
    { error: { code, message, requestId } },
    { status }
  );
}

export function getRequestId(request: Request): string {
  return request.headers.get("x-request-id") ?? randomUUID();
}

export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host");
  if (!host) return false;
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

export async function validateCsrf(request: Request): Promise<boolean> {
  if (request.method === "GET" || request.method === "HEAD") return true;
  if (!validateOrigin(request)) return false;
  const headerToken = request.headers.get("x-csrf-token");
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${AUTH_COOKIE_CSRF}=([^;]+)`));
  const cookieToken = match?.[1];
  return Boolean(headerToken && cookieToken && headerToken === cookieToken);
}

type HandlerContext = { params?: Promise<Record<string, string>> };

export interface GuardOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  rateLimitKey?: string;
  rateLimitMax?: number;
  skipCsrf?: boolean;
  querySchema?: z.ZodTypeAny;
  bodySchema?: z.ZodTypeAny;
}

export function withGuards(
  handler: (
    request: Request,
    context: HandlerContext & { userId?: string; isAdmin?: boolean; requestId: string }
  ) => Promise<Response>,
  options: GuardOptions = {}
) {
  return async (request: Request, context: HandlerContext = {}) => {
    const requestId = getRequestId(request);
    const start = Date.now();

    try {
      if (!options.skipCsrf && !(await validateCsrf(request))) {
        return apiError("CSRF_INVALID", "Invalid CSRF token", 403, requestId);
      }

      let userId: string | undefined;
      let isAdmin = false;

      if (options.requireAdmin) {
        const user = await requireAdmin();
        userId = user.userId;
        isAdmin = user.isAdmin;
      } else if (options.requireAuth !== false) {
        const user = await requireUser();
        userId = user.userId;
        isAdmin = user.isAdmin;
      }

      const rateKey = options.rateLimitKey ?? userId ?? request.headers.get("x-forwarded-for") ?? "anon";
      const allowed = await checkRateLimit(rateKey, options.rateLimitMax ?? 120);
      if (!allowed) {
        return apiError("RATE_LIMITED", "Too many requests", 429, requestId);
      }

      if (options.querySchema) {
        const url = new URL(request.url);
        const query = Object.fromEntries(url.searchParams.entries());
        const parsed = options.querySchema.safeParse(query);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", parsed.error.message, 400, requestId);
        }
      }

      if (options.bodySchema && request.method !== "GET" && request.method !== "HEAD") {
        const body = await request.clone().json();
        const parsed = options.bodySchema.safeParse(body);
        if (!parsed.success) {
          return apiError("VALIDATION_ERROR", parsed.error.message, 400, requestId);
        }
      }

      const response = await handler(request, { ...context, userId, isAdmin, requestId });
      logger.info({
        requestId,
        userId,
        route: new URL(request.url).pathname,
        method: request.method,
        status: response.status,
        latencyMs: Date.now() - start
      });
      return response;
    } catch (error) {
      if (error instanceof AuthError) {
        return apiError(error.code, error.message, error.status, requestId);
      }
      logger.error({ requestId, error: String(error) });
      return apiError("INTERNAL_ERROR", "Internal server error", 500, requestId);
    }
  };
}

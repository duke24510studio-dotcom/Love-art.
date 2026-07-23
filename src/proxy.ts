import { NextRequest, NextResponse } from "next/server";

// The (admin) tool (dashboard, posters, articles, Rakuten review studio,
// multiview) has delete buttons and buttons that trigger paid OpenAI calls —
// it must never be reachable on the open internet without credentials. Only
// the public blog (and the static assets it needs) is allowed through.
const PUBLIC_PATH_PATTERNS = [/^\/blog(\/|$)/, /^\/api\/static\//, /^\/outputs\//, /^\/favicon\.ico$/];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PATTERNS.some((re) => re.test(pathname));
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const user = process.env.ADMIN_BASIC_USER;
  const pass = process.env.ADMIN_BASIC_PASS;

  if (!user || !pass) {
    // Fail closed in production: an unconfigured admin tool must not be
    // silently wide open. Local dev (no NODE_ENV=production) stays
    // unauthenticated for convenience.
    if (process.env.NODE_ENV === "production") {
      return new NextResponse(
        "Admin auth is not configured. Set ADMIN_BASIC_USER and ADMIN_BASIC_PASS.",
        { status: 503 }
      );
    }
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice("Basic ".length));
    const separatorIndex = decoded.indexOf(":");
    const suppliedUser = decoded.slice(0, separatorIndex);
    const suppliedPass = decoded.slice(separatorIndex + 1);
    if (suppliedUser === user && suppliedPass === pass) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};

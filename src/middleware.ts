import { NextRequest, NextResponse } from "next/server";

const protectedPaths = [
  "/candidates",
  "/published",
  "/api/articles/visibility",
  "/api/site-pages",
  "/api/x-candidates",
  "/api/hermes",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api/x-candidates/") &&
    pathname.endsWith("/image.svg")
  ) {
    return NextResponse.next();
  }

  const shouldProtect = protectedPaths.some((path) =>
    pathname.startsWith(path),
  );

  if (!shouldProtect) {
    return NextResponse.next();
  }

  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;

  if (!user || !password) {
    return new NextResponse("Admin access is not configured.", {
      status: 403,
    });
  }

  const auth = request.headers.get("authorization");
  const expected = `Basic ${btoa(`${user}:${password}`)}`;

  if (auth === expected) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required.", {
    headers: {
      "WWW-Authenticate": 'Basic realm="AI Insight JP Admin"',
    },
    status: 401,
  });
}

export const config = {
  matcher: [
    "/candidates/:path*",
    "/published/:path*",
    "/api/articles/visibility/:path*",
    "/api/site-pages/:path*",
    "/api/x-candidates/:path*",
    "/api/hermes/:path*",
  ],
};

import { route, jstToday } from "@/lib/api-server";

export const GET = route(async (_req, { user }) => ({ ...user, today: jstToday() }));

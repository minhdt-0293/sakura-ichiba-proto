import { route } from "@/lib/api-server";
import { REPORTS } from "@/lib/reports";

export const GET = route(async () => REPORTS.map(({ run, ...meta }) => meta));

import { getStatsHandler } from "@/lib/controllers/profileController";
import { withAuth, withErrorHandler } from "@/utils/handler";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(withAuth(getStatsHandler));

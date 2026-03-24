import { getLeaderboardHandler } from "@/controllers/leaderboardController";
import { withErrorHandler } from "@/utils/handler";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(getLeaderboardHandler);

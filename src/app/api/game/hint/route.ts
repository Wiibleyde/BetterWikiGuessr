import { getHintHandler } from "@/lib/controllers/gameController";
import { withErrorHandler, withOptionalAuth } from "@/utils/handler";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(withOptionalAuth(getHintHandler));

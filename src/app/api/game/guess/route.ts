import { submitGuessHandler } from "@/controllers/gameController";
import { withErrorHandler, withRateLimit } from "@/utils/handler";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(withRateLimit(submitGuessHandler));

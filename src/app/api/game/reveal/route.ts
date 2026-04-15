import { revealAllHandler } from "@/lib/controllers/gameController";
import { withErrorHandler } from "@/utils/handler";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(revealAllHandler);

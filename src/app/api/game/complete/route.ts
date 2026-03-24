import { completeGameHandler } from "@/controllers/gameController";
import { withAuth, withErrorHandler } from "@/utils/handler";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(withAuth(completeGameHandler));

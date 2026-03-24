import {
    getStateHandler,
    saveStateHandler,
} from "@/controllers/gameController";
import { withAuth, withErrorHandler } from "@/utils/handler";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(withAuth(getStateHandler));
export const PUT = withErrorHandler(withAuth(saveStateHandler));

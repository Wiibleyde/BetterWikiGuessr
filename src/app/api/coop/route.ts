import { createLobbyHandler } from "@/lib/controllers/coopController";
import { withErrorHandler } from "@/utils/handler";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(createLobbyHandler);

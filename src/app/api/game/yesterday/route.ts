import { getYesterdayHandler } from "@/controllers/gameController";
import { withErrorHandler } from "@/utils/handler";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(getYesterdayHandler);

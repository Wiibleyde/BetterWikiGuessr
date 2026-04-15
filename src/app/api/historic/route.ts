import { getHistoricHandler } from "@/lib/controllers/historicController";
import { withErrorHandler } from "@/utils/handler";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(getHistoricHandler);

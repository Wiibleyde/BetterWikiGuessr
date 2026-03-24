import { getHistoricHandler } from "@/controllers/historicController";
import { withErrorHandler } from "@/utils/handler";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(getHistoricHandler);

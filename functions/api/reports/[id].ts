import { updateReportStatus, type Env } from "../../../server/handlers";

export const onRequestPatch: PagesFunction<Env> = ({ request, env, params }) =>
  updateReportStatus(request, env, String(params.id));

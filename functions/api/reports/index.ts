import { getReports, type Env } from "../../../server/handlers";

export const onRequestGet: PagesFunction<Env> = ({ request, env }) => getReports(request, env);

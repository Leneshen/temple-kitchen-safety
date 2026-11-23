import { submitReport, type Env } from "../../server/handlers";

export const onRequestPost: PagesFunction<Env> = ({ request, env }) => submitReport(request, env);

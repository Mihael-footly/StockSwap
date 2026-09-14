import { endpoint,body,limit } from '@/server/http';
import { recordEvent } from '@/server/store';
import { z } from 'zod';
const schema=z.object({event:z.enum(['wallet_connected','asset_selected','amount_entered','quote_requested','quote_received','route_expanded','approval_started','approval_confirmed','swap_started','swap_submitted','swap_completed','swap_failed']),properties:z.object({asset:z.string().max(80).optional(),pair:z.string().max(160).optional(),code:z.string().max(80).optional()}).strict().default({})}).strict();
export async function POST(req:Request){return endpoint(async()=>{await limit(req);const data=schema.parse(await body(req));await recordEvent(data.event,data.properties);return {ok:true};});}

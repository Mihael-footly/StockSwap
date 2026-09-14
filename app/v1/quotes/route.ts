import { endpoint,body,limit } from '@/server/http';
import { createQuote } from '@/server/service';
export const maxDuration=60;
export async function POST(req:Request){return endpoint(async()=>{await limit(req);return createQuote(await body(req));});}

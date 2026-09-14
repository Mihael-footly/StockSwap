import { endpoint,body,limit } from '@/server/http';
import { attachTransaction } from '@/server/service';
export async function POST(req:Request){return endpoint(async()=>{await limit(req);return attachTransaction(await body(req));});}

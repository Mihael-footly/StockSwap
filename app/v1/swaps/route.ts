import { endpoint,body,limit } from '@/server/http';
import { prepareSwap } from '@/server/service';
import { listSwaps } from '@/server/store';
import { addressSchema } from '@/server/validation';
export const maxDuration=60;
export async function POST(req:Request){return endpoint(async()=>{await limit(req);return prepareSwap(await body(req));});}
export async function GET(req:Request){return endpoint(async()=>({swaps:await listSwaps(addressSchema.parse(new URL(req.url).searchParams.get('wallet')))}));}

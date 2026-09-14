import { endpoint } from '@/server/http';
import { requireChain } from '@/server/rpc';
import { config } from '@/server/config';
export async function GET(){return endpoint(async()=>({config:config(),block:(await (await requireChain()).getBlockNumber()).toString()}));}

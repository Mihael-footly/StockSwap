import { endpoint } from '@/server/http';
import { getQuote } from '@/server/store';
import { requireFresh } from '@/routing/safety';
import { z } from 'zod';
export async function GET(_:Request,ctx:{params:Promise<{id:string}>}){return endpoint(async()=>{const {id}=await ctx.params;const quote=await getQuote(z.string().uuid().parse(id));requireFresh(quote.expiresAt);return quote;});}

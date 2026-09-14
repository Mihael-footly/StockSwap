import { endpoint } from '@/server/http';
import { refreshedSwap } from '@/server/reconcile';
import { z } from 'zod';
export async function GET(_:Request,ctx:{params:Promise<{id:string}>}){return endpoint(async()=>refreshedSwap(z.string().uuid().parse((await ctx.params).id)));}

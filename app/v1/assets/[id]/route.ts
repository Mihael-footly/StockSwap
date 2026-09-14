import { endpoint } from '@/server/http';
import { catalog } from '@/server/registry';
import { AppError } from '@/server/errors';
export async function GET(_:Request,ctx:{params:Promise<{id:string}>}){return endpoint(async()=>{const {id}=await ctx.params;const asset=catalog.find(a=>a.id===id);if(!asset)throw new AppError('ASSET_NOT_FOUND','Asset not found.',404);return asset;});}

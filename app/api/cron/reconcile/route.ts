import { endpoint } from '@/server/http';
import { reconcilePending } from '@/server/reconcile';
import { AppError } from '@/server/errors';
import { timingSafeEqual } from 'node:crypto';
export const maxDuration=60;
export async function GET(req:Request){return endpoint(async()=>{const secret=process.env.CRON_SECRET;const auth=req.headers.get('authorization')||'';const expected=`Bearer ${secret}`;if(!secret||auth.length!==expected.length||!timingSafeEqual(Buffer.from(auth),Buffer.from(expected)))throw new AppError('UNAUTHORIZED','Unauthorized.',401);return reconcilePending();});}

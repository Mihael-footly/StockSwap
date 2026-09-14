import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createHash } from 'node:crypto';
import { AppError } from './errors';
import { db } from './store';
export async function body(req:Request){
 const text=await req.text();if(text.length>8192)throw new AppError('REQUEST_TOO_LARGE','Request is too large.',413);
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)throw new AppError('INVALID_ORIGIN','Invalid request origin.',403);
 try{return JSON.parse(text);}catch{throw new AppError('INVALID_JSON','Request must be valid JSON.');}
}
export async function limit(req:Request){
 if(!process.env.DATABASE_URL)return;
 const ip=req.headers.get('x-vercel-forwarded-for')||req.headers.get('x-forwarded-for')||'local';
 const key=createHash('sha256').update(ip.split(',')[0]).digest('hex');
 const window=new Date(Math.floor(Date.now()/60000)*60000).toISOString();
 const rows=await db()`insert into api_rate_limits(key,window_start,count) values(${key},${window},1) on conflict(key,window_start) do update set count=api_rate_limits.count+1 returning count`;
 if(rows[0].count>60)throw new AppError('RATE_LIMITED','Too many requests. Try again in a minute.',429);
}
export async function endpoint(fn:()=>Promise<unknown>){try{return NextResponse.json(await fn(),{headers:{'Cache-Control':'no-store'}});}catch(e){
 if(e instanceof AppError)return NextResponse.json({error:{code:e.code,message:e.message}},{status:e.status});
 if(e instanceof ZodError)return NextResponse.json({error:{code:'INVALID_REQUEST',message:'Some request fields are invalid.',fields:e.issues.map(x=>({path:x.path,message:x.message}))}},{status:400});
 console.error('request_failed',{type:e instanceof Error?e.name:'Unknown'});
 return NextResponse.json({error:{code:'SERVICE_UNAVAILABLE',message:'The service could not complete this request. Please try again.'}},{status:503});
}}

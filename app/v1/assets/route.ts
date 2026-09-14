import { endpoint } from '@/server/http';
import { catalog,liveAssets } from '@/server/registry';
import { config } from '@/server/config';
export const dynamic='force-dynamic';
export async function GET(){return endpoint(async()=>{let assets;try{assets=await liveAssets();}catch{return {assets:[],catalog,config:config(),registryStatus:'unavailable'};}return {assets,catalog,config:config(),registryStatus:'live'};});}

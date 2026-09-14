import { Swap } from '@/components/swap';
import { config } from '@/server/config';
import { catalog } from '@/server/registry';
export default async function Page({params}:{params:Promise<{id:string;to:string}>}){const {id,to}=await params;return <Swap catalog={catalog} config={config()} initialFrom={id.toUpperCase()} initialTo={to.toUpperCase()}/>;}

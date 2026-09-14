import { AssetDetail } from '@/components/explore';
import { catalog } from '@/server/registry';
import { notFound } from 'next/navigation';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const asset=catalog.find(a=>a.id===id);if(!asset)notFound();return <AssetDetail asset={asset}/>;}

import { Receipt } from '@/components/activity';
import { config } from '@/server/config';
import { notFound } from 'next/navigation';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))notFound();return <Receipt id={id} config={config()}/>;}

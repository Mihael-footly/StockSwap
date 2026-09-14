import { Swap } from '@/components/swap';
import { catalog } from '@/server/registry';
import { config } from '@/server/config';
export default function Home(){return <Swap catalog={catalog} config={config()}/>;}

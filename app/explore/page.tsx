import { Explore } from '@/components/explore';
import { catalog } from '@/server/registry';
export const metadata={title:'Explore verified assets'};
export default function Page(){return <Explore assets={catalog}/>;}

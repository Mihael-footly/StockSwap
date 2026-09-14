import { Activity } from '@/components/activity';
import { config } from '@/server/config';
export const metadata={title:'Your activity'};
export default function Page(){return <Activity config={config()}/>;}

import type { Metadata,Viewport } from 'next';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import './globals.css';
import { Shell } from '@/components/shell';
import { config } from '@/server/config';
export const metadata:Metadata={title:{default:'StockSwap — Swap stock exposure.',template:'%s | StockSwap'},description:'Move from one supported stock-linked asset to another through the best available route. Verified assets. Transparent routing.',icons:{icon:'/icon.svg'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#08110E'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><a className="skip-link" href="#content">Skip to content</a><Shell config={config()}><div id="content">{children}</div></Shell></body></html>;}

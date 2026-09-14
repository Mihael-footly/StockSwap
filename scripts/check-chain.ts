import { createPublicClient,http,erc20Abi } from 'viem';
import { catalog, intermediates } from '../src/server/registry';
import { venueAddress,UniswapV2Adapter,UniswapV3Adapter } from '../src/routing/adapters';
const client=createPublicClient({transport:http('https://rpc.mainnet.chain.robinhood.com',{timeout:10000})});
async function main(){
 console.log('Verified RPC chain',await client.getChainId());
 const live=await fetch('https://api.robinhood.com/rhj/assets').then(r=>r.json());
 console.log('HOOD in canonical registry:',live.assets.some((a:{tokenSymbol:string})=>a.tokenSymbol==='HOOD'));
 for(const name of ['UniswapV3Factory','QuoterV2','SwapRouter02','UniswapV2Factory','UniswapV2Router02'])console.log(name,venueAddress(name),'has bytecode:',!!(await client.getCode({address:venueAddress(name)})));
 const [a,b]=['AAPL','NVDA'].map(s=>catalog.find(a=>a.symbol===s)!);
 for(const asset of [a,b])console.log(asset.symbol,'decimals:',await client.readContract({address:asset.tokenAddress,abi:erc20Abi,functionName:'decimals'}));
 const p={sourceAsset:a,destinationAsset:b,amount:10n**18n,wallet:'0x0000000000000000000000000000000000000001' as const,chainId:4663,slippageTolerance:50};
 for(const adapter of [new UniswapV2Adapter(client),new UniswapV3Adapter(client)]){
  const quotes=await adapter.quote(p,[a,b]);console.log(adapter.name,'AAPL → NVDA direct:',JSON.stringify(quotes,(_,v)=>typeof v==='bigint'?v.toString():v)); const hop=await adapter.quote(p,[a,intermediates[0],b]);console.log(adapter.name,'AAPL → USDG → NVDA:',JSON.stringify(hop,(_,v)=>typeof v==='bigint'?v.toString():v));
 }
}
main().catch(e=>{console.error(e.shortMessage||e.message);process.exitCode=1;});

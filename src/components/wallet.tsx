'use client';
import { createContext,useContext,useEffect,useState,useCallback,type ReactNode } from 'react';
import { createWalletClient,custom,defineChain, type Address,type EIP1193Provider,type Hex } from 'viem';
import { X,ArrowUpRight,Wallet,Smartphone,LogOut } from 'lucide-react';
import type { AppConfig,TransactionRequest } from '../lib/types';
import { short,track } from '../lib/client';
import { Modal } from './modal';
type Provider=EIP1193Provider&{on?:(event:string,handler:(value:unknown)=>void)=>void;removeListener?:(event:string,handler:(value:unknown)=>void)=>void;disconnect?:()=>Promise<void>};
const Context=createContext<{address:Address|null;open:()=>void;send:(tx:TransactionRequest)=>Promise<Hex>;chainId:number|null;disconnect:()=>void}>({address:null,open:()=>{},send:async()=>{throw Error('Connect a wallet');},chainId:null,disconnect:()=>{}});
export const useWallet=()=>useContext(Context);
export function WalletProvider({config,children}:{config:AppConfig;children:ReactNode}){
 const [provider,setProvider]=useState<Provider|null>(null),[address,setAddress]=useState<Address|null>(null),[chainId,setChainId]=useState<number|null>(null),[show,setShow]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(!provider)return;const accounts=(v:unknown)=>{setAddress((v as Address[])[0]||null);};const chain=(v:unknown)=>setChainId(Number(v));provider.on?.('accountsChanged',accounts);provider.on?.('chainChanged',chain);return()=>{provider.removeListener?.('accountsChanged',accounts);provider.removeListener?.('chainChanged',chain);};},[provider]);
 async function connect(kind:'browser'|'mobile'){
  setBusy(true);setError('');
  try{
   let p:Provider;
   if(kind==='mobile'){
    if(!config.walletConnectProjectId)throw Error('Mobile pairing is not configured for this deployment yet. You can use a wallet’s built-in browser.');
    const {EthereumProvider}=await import('@walletconnect/ethereum-provider');
    p=await EthereumProvider.init({projectId:config.walletConnectProjectId,chains:[config.chainId],showQrModal:true,rpcMap:{[config.chainId]:config.publicRpcUrl},metadata:{name:'StockSwap',description:'Swap stock exposure.',url:window.location.origin,icons:[window.location.origin+'/icon.svg']}}) as unknown as Provider;
   }else{
    p=(window as unknown as {ethereum?:Provider}).ethereum!;
    if(!p)throw Error('No browser wallet found. Open StockSwap in your wallet browser, or install an EVM wallet.');
   }
   const accounts=await p.request({method:'eth_requestAccounts'});if(!accounts[0])throw Error('No account selected.');
   setProvider(p);setAddress(accounts[0]);setChainId(Number(await p.request({method:'eth_chainId'})));setShow(false);track('wallet_connected');
  }catch(e){setError(e instanceof Error?e.message:'Wallet connection was declined.');}finally{setBusy(false);}
 }
 const disconnect=useCallback(()=>{void provider?.disconnect?.();setAddress(null);setProvider(null);setChainId(null);setShow(false);},[provider]);
 async function send(tx:TransactionRequest){
  if(!provider||!address)throw Error('Connect your wallet first.');
  if(tx.chainId!==config.chainId)throw Error('The transaction requests an unsupported network.');
  const expected=address;
  const accounts=await provider.request({method:'eth_accounts'});if(accounts[0]?.toLowerCase()!==expected.toLowerCase())throw Error('Your wallet account changed. Request a new quote.');
  if(Number(await provider.request({method:'eth_chainId'}))!==config.chainId){
   try{await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:`0x${config.chainId.toString(16)}`}]});}
   catch(e){if((e as {code?:number}).code!==4902)throw e;await provider.request({method:'wallet_addEthereumChain',params:[{chainId:`0x${config.chainId.toString(16)}`,chainName:config.chainName,nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:[config.publicRpcUrl],blockExplorerUrls:[config.explorerUrl]}]});}
  }
  if(Number(await provider.request({method:'eth_chainId'}))!==config.chainId)throw Error('Switch your wallet to the supported network.');
  const c=defineChain({id:config.chainId,name:config.chainName,nativeCurrency:{name:'Ether',symbol:'ETH',decimals:18},rpcUrls:{default:{http:[config.publicRpcUrl]}}});
  return createWalletClient({chain:c,transport:custom(provider)}).sendTransaction({account:expected,to:tx.to,data:tx.data,value:BigInt(tx.value)});
 }
 return <Context.Provider value={{address,open:()=>{setShow(true);setError('');},send,chainId,disconnect}}>{children}{show&&<Modal title={address?'Your wallet':'Connect your wallet'} onClose={()=>setShow(false)}><p className="modal-intro">{address?'You stay in control of your assets.':'Choose how you’d like to connect. Your assets stay in your wallet.'}</p>{address?<><div className="wallet-address">{short(address)}</div><button className="wallet-option" onClick={disconnect}><LogOut size={20}/> Disconnect wallet</button></>:<><button className="wallet-option" onClick={()=>connect('browser')} disabled={busy}><span className="wallet-icon"><Wallet size={23}/></span><span><strong>Browser wallet</strong><small>MetaMask, Rabby & other EVM wallets</small></span><ArrowUpRight size={18}/></button><button className="wallet-option" onClick={()=>connect('mobile')} disabled={busy}><span className="wallet-icon blue"><Smartphone size={23}/></span><span><strong>WalletConnect</strong><small>{config.walletConnectProjectId?'Scan with your mobile wallet':'Mobile pairing setup pending'}</small></span><ArrowUpRight size={18}/></button></>}{error&&<p className="error-box" role="alert">{error}</p>}<p className="modal-footnote">StockSwap will never ask for your recovery phrase or private key.</p></Modal>}</Context.Provider>;
}

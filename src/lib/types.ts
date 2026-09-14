import type { Address, Hex } from 'viem';
export type SupportedAsset = {
 id: string; symbol: string; displayName: string; referenceTicker: string; issuer: string;
 tokenAddress: Address; chainId: number; decimals: number; assetType: 'stock_token' | 'stablecoin';
 officialDocsUrl: string; logoUrl: string; enabled: boolean; swapEnabled: boolean;
 riskStatus: 'supported' | 'paused'; legalStructure: string; underlyingReference: string;
 transferRestrictions: string; multiplier: string;
};
export type RouteStep = { provider: string; tokenIn: string; tokenOut: string; amountInRaw: string; expectedOutRaw: string; poolAddress: Address; feePips: number };
export type SwapRoute = {
 id: string; sourceAssetId: string; destinationAssetId: string; amountInRaw: string;
 expectedAmountOutRaw: string; minimumAmountOutRaw: string; steps: RouteStep[];
 priceImpactBps: number; referenceDeviationBps: number; protocolFeeRaw: string;
 gasEstimate: string | null; gasFeeWei: string | null; estimatedSeconds: number | null;
 quoteExpiresAt: string; securityLevel: 'verified' | 'supported'; provider: string;
 liquidityScore: number; reliabilityScore: number; path: Address[]; fees: number[];
};
export type QuoteParams = { sourceAsset: SupportedAsset; destinationAsset: SupportedAsset; amount: bigint; wallet: Address; chainId: number; slippageTolerance: number };
export type TransactionRequest = { to: Address; data: Hex; value: string; chainId: number };
export type RouteQuote = { amountOut: bigint; steps: RouteStep[]; spotAmountOut: bigint; gasEstimate: bigint | null; path: Address[]; fees: number[]; liquidityScore: number };
export type BuildSwapParams = { route: SwapRoute; wallet: Address; chainId: number };
export interface LiquidityAdapter {
 name: string; securityLevel: 'verified' | 'supported'; reliabilityScore: number;
 supportsPair(inputAsset: SupportedAsset, outputAsset: SupportedAsset): Promise<boolean>;
 quote(params: QuoteParams, path: SupportedAsset[]): Promise<RouteQuote[]>;
 buildTransaction(params: BuildSwapParams): TransactionRequest;
}
export type Price = { usdE8: string; generatedAt: string; source: string };
export type QuoteRecord = { id: string; wallet: Address; chainId: number; sourceAsset: SupportedAsset; destinationAsset: SupportedAsset; routes: SwapRoute[]; slippageBps: number; createdAt: string; expiresAt: string; prices: Record<string, Price> };
export type SwapStatus = 'READY_TO_SWAP' | 'SWAP_SUBMITTED' | 'CONFIRMING' | 'COMPLETED' | 'FAILED';
export type SwapRecord = { id: string; publicId: string; wallet: Address; chainId: number; quote: QuoteRecord; route: SwapRoute; transaction: TransactionRequest; status: SwapStatus; txHash: Hex | null; actualOutRaw: string | null; blockNumber: string | null; gasFeeWei: string | null; createdAt: string; completedAt: string | null; failureReason: string | null };
export type AppConfig = { chainId: number; chainName: string; testnet: boolean; explorerUrl: string; publicRpcUrl: string; executionEnabled: boolean; storageReady: boolean; walletConnectProjectId: string | null };

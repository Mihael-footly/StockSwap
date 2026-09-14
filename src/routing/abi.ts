import { parseAbi } from 'viem';
export const v3FactoryAbi=parseAbi(['function getPool(address,address,uint24) view returns (address)']);
export const v3PoolAbi=parseAbi(['function liquidity() view returns (uint128)','function slot0() view returns (uint160,int24,uint16,uint16,uint16,uint8,bool)']);
export const quoterAbi=parseAbi(['function quoteExactInput(bytes path,uint256 amountIn) returns (uint256 amountOut,uint160[] sqrtPriceX96AfterList,uint32[] initializedTicksCrossedList,uint256 gasEstimate)']);
export const router02Abi=parseAbi(['function exactInput((bytes path,address recipient,uint256 amountIn,uint256 amountOutMinimum) params) payable returns (uint256 amountOut)','function multicall(uint256 deadline,bytes[] data) payable returns (bytes[] results)']);
export const v2FactoryAbi=parseAbi(['function getPair(address,address) view returns (address)']);
export const v2PairAbi=parseAbi(['function getReserves() view returns (uint112,uint112,uint32)','function token0() view returns (address)']);
export const v2RouterAbi=parseAbi(['function swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline) returns (uint256[] amounts)']);

import { describe, expect, it } from 'vitest';
import { minimumOutput, requireFresh, priceImpact, rankRoutes } from '../src/routing/safety';
import type { SwapRoute } from '../src/lib/types';
const route = (id: string, output: string, changes = {}): SwapRoute => ({ id, expectedAmountOutRaw: output, quoteExpiresAt: new Date(Date.now()+30000).toISOString(), priceImpactBps: 20, referenceDeviationBps: 20, securityLevel: 'verified', liquidityScore: 90, reliabilityScore: 99, steps: [{}], gasFeeWei: null, ...changes } as SwapRoute);
describe('execution safety', () => {
 it('floors minimum output using integer arithmetic, even above JS precision', () => expect(minimumOutput(10000000000000000001n,50)).toBe(9950000000000000000n));
 it.each([-1,501,NaN,0.5])('rejects invalid slippage %s', bps => expect(()=>minimumOutput(10n,bps)).toThrow());
 it('rejects a rounded-to-zero output', () => expect(()=>minimumOutput(1n,50)).toThrow());
 it('rejects expired and invalid timestamps', () => { expect(()=>requireFresh(new Date(1000).toISOString(),1000)).toThrow(); expect(()=>requireFresh('garbage')).toThrow(); });
 it('accepts a fresh quote', () => expect(()=>requireFresh(new Date(2000).toISOString(),1000)).not.toThrow());
 it('calculates conservative basis-point impact', () => expect(priceImpact(10000n,9879n)).toBe(121));
 it('does not turn better-than-spot execution into a negative impact', () => expect(priceImpact(100n,101n)).toBe(0));
 it('refuses more than 5% impact or reference deviation', () => expect(rankRoutes([route('bad','120',{priceImpactBps:501}), route('deviant','120',{referenceDeviationBps:700}),route('good','99')]).map(r=>r.id)).toEqual(['good']));
 it('does not prefer an unsafe larger output', () => expect(rankRoutes([route('unreliable','1000',{reliabilityScore:10}),route('safe','100')])[0].id).toBe('safe'));
 it('ranks real output then favors fewer hops for equal output', () => expect(rankRoutes([route('hop','100',{steps:[{},{}]}),route('direct','100'),route('best','102')]).map(r=>r.id)).toEqual(['best','direct','hop']));
});

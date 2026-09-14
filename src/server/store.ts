import type { QuoteRecord, SwapRecord } from '../lib/types';
import { AppError, storageUnavailable } from './errors';
import { isSupabaseConfigured, supabaseAdmin } from './supabase';

type StoredRow = { data: unknown };

async function storageQuery<T>(query: () => Promise<T>): Promise<T> {
  if (!isSupabaseConfigured()) throw storageUnavailable();
  try {
    return await query();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw storageUnavailable();
  }
}

function throwIfError(error: { message: string; code?: string } | null): asserts error is null {
  if (error) throw error;
}

export async function saveQuote(q: QuoteRecord) {
  await storageQuery(async () => {
    const { error } = await supabaseAdmin().from('swap_quotes').insert({
      id: q.id,
      wallet_address: q.wallet.toLowerCase(),
      expires_at: q.expiresAt,
      data: q,
    });
    throwIfError(error);
  });
}

export async function getQuote(id: string): Promise<QuoteRecord> {
  return storageQuery(async () => {
    const { data, error } = await supabaseAdmin().from('swap_quotes').select('data').eq('id', id).maybeSingle<StoredRow>();
    throwIfError(error);
    if (!data) throw new AppError('QUOTE_NOT_FOUND', 'Quote not found.', 404);
    return data.data as QuoteRecord;
  });
}

export async function savePreparedSwap(s: SwapRecord, startBlock: bigint) {
  return storageQuery(async () => {
    const client = supabaseAdmin();
    const inserted = await client
      .from('swaps')
      .insert({
        id: s.id,
        public_id: s.publicId,
        quote_id: s.quote.id,
        wallet_address: s.wallet.toLowerCase(),
        chain_id: s.chainId,
        status: s.status,
        scan_cursor: startBlock.toString(),
        data: s,
      })
      .select('data')
      .maybeSingle<StoredRow>();

    if (!inserted.error) {
      if (!inserted.data) throw storageUnavailable();
      return inserted.data.data as SwapRecord;
    }
    if (inserted.error.code !== '23505') throw inserted.error;

    const existing = await client.from('swaps').select('data').eq('quote_id', s.quote.id).maybeSingle<StoredRow>();
    throwIfError(existing.error);
    if (!existing.data) throw storageUnavailable();
    return existing.data.data as SwapRecord;
  });
}

async function findSwap(column: 'public_id' | 'id', id: string): Promise<SwapRecord | null> {
  const { data, error } = await supabaseAdmin().from('swaps').select('data').eq(column, id).maybeSingle<StoredRow>();
  throwIfError(error);
  return data ? (data.data as SwapRecord) : null;
}

export async function getSwap(id: string): Promise<SwapRecord> {
  return storageQuery(async () => {
    const swap = (await findSwap('public_id', id)) || (await findSwap('id', id));
    if (!swap) throw new AppError('SWAP_NOT_FOUND', 'Swap not found.', 404);
    return swap;
  });
}

export async function updateSwap(s: SwapRecord) {
  await storageQuery(async () => {
    const { error } = await supabaseAdmin()
      .from('swaps')
      .update({ status: s.status, tx_hash: s.txHash, data: s, updated_at: new Date().toISOString() })
      .eq('id', s.id)
      .not('status', 'in', '("COMPLETED","FAILED")');
    throwIfError(error);
  });
}

export async function listSwaps(wallet: string): Promise<SwapRecord[]> {
  return storageQuery(async () => {
    const { data, error } = await supabaseAdmin()
      .from('swaps')
      .select('data')
      .eq('wallet_address', wallet.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(100);
    throwIfError(error);
    return (data || []).map((row) => (row as StoredRow).data as SwapRecord);
  });
}

export async function recordEvent(event: string, properties: Record<string, string | number | boolean>) {
  if (!isSupabaseConfigured()) return;
  await storageQuery(async () => {
    const { error } = await supabaseAdmin().from('analytics_events').insert({ event, properties });
    throwIfError(error);
  });
}

export async function incrementRateLimit(key: string, windowStart: string): Promise<number> {
  return storageQuery(async () => {
    const client = supabaseAdmin();
    const { data, error } = await client.rpc('bump_api_rate_limit', {
      p_key: key,
      p_window_start: windowStart,
    });
    if (!error) {
      const count = Number(data);
      if (!Number.isFinite(count)) throw storageUnavailable();
      return count;
    }

    // Older projects may have the base schema but not the optional RPC yet.
    // Keep the endpoint usable while the function is rolled out; the RPC is
    // the atomic path once present.
    if (error.code !== '42883' && error.code !== 'PGRST202') throw error;
    const existing = await client.from('api_rate_limits').select('count').eq('key', key).eq('window_start', windowStart).maybeSingle<{ count: number }>();
    throwIfError(existing.error);
    const nextCount = Number(existing.data?.count || 0) + 1;
    const upserted = await client.from('api_rate_limits').upsert({ key, window_start: windowStart, count: nextCount }, { onConflict: 'key,window_start' });
    throwIfError(upserted.error);
    return nextCount;
  });
}

export async function listPendingSwaps(chainId: number): Promise<Array<{ data: SwapRecord; scan_cursor: string }>> {
  return storageQuery(async () => {
    const { data, error } = await supabaseAdmin()
      .from('swaps')
      .select('data,scan_cursor')
      .eq('chain_id', chainId)
      .in('status', ['READY_TO_SWAP', 'SWAP_SUBMITTED', 'CONFIRMING'])
      .order('created_at', { ascending: true })
      .limit(10);
    throwIfError(error);
    return (data || []).map((row) => ({ data: (row as { data: SwapRecord }).data, scan_cursor: String((row as { scan_cursor: string | number }).scan_cursor) }));
  });
}

export async function updateScanCursor(id: string, scanCursor: bigint) {
  await storageQuery(async () => {
    const { error } = await supabaseAdmin().from('swaps').update({ scan_cursor: scanCursor.toString(), updated_at: new Date().toISOString() }).eq('id', id);
    throwIfError(error);
  });
}

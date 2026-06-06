import { TrawlRepository } from '../design-memory/trawl-repository';
import { getDesignSupabase, DESIGN_SCHEMA } from '../design-memory/supabase';
import type { TrawlRequest, TrawlResult } from './types';
import { crawlUrl } from './crawler';
import { getSourceConfig, getDomainFromUrl } from './source-registry';

export interface RunOptions {
  concurrency?: number;
  retries?: number;
  trigger?: string;
  triggered_by?: string;
  capture_screenshot?: boolean;
}

export interface RunSummary {
  run_id: string;
  status: 'COMPLETE' | 'PARTIAL' | 'FAILED';
  urls_requested: number;
  urls_succeeded: number;
  urls_failed: number;
  urls_skipped: number;
  duration_ms: number;
  results: TrawlResult[];
}

async function createRunRecord(urlCount: number, trigger: string, triggeredBy?: string): Promise<string> {
  const supabase = getDesignSupabase();
  if (!supabase) return `offline-${Date.now()}`;

  const { data, error } = await supabase
    .schema(DESIGN_SCHEMA)
    .from('trawl_runs')
    .insert({ trigger, triggered_by: triggeredBy, urls_requested: urlCount, status: 'RUNNING' })
    .select('id')
    .single();

  if (error) {
    console.warn('[runner] Could not create run record:', error.message);
    return `offline-${Date.now()}`;
  }
  return (data as { id: string }).id;
}

async function finalizeRunRecord(runId: string, results: TrawlResult[], startMs: number): Promise<void> {
  const supabase = getDesignSupabase();
  if (!supabase || runId.startsWith('offline-')) return;

  const succeeded = results.filter((r) => r.status === 'SUCCESS').length;
  const failed    = results.filter((r) => r.status === 'FAILED').length;
  const skipped   = results.filter((r) => r.status === 'SKIPPED').length;
  const durationMs = Date.now() - startMs;
  const status = failed === results.length ? 'FAILED' : failed > 0 || skipped > 0 ? 'PARTIAL' : 'COMPLETE';

  await supabase
    .schema(DESIGN_SCHEMA)
    .from('trawl_runs')
    .update({ urls_succeeded: succeeded, urls_failed: failed, urls_skipped: skipped,
      finished_at: new Date().toISOString(), duration_ms: durationMs, status, results: JSON.stringify(results) })
    .eq('id', runId);
}

export async function runBatch(urls: string[], options: RunOptions = {}): Promise<RunSummary> {
  const { concurrency = 3, retries = 1, trigger = 'manual', triggered_by, capture_screenshot = false } = options;
  const startMs = Date.now();
  const repo = new TrawlRepository();
  const runId = await createRunRecord(urls.length, trigger, triggered_by);

  console.log(`\n[trawl-runner] Starting run ${runId}`);
  console.log(`[trawl-runner] ${urls.length} URLs | concurrency=${concurrency} | retries=${retries}`);

  const results: TrawlResult[] = [];

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const domain = getDomainFromUrl(url);
        const config = domain ? getSourceConfig(domain) : null;

        const req: TrawlRequest = { urls: [url], viewport: 'desktop-1440', capture_screenshot };

        let result = await crawlUrl(url, req, repo);
        for (let attempt = 1; attempt <= retries && result.status === 'FAILED'; attempt++) {
          console.log(`[trawl-runner] Retry ${attempt}/${retries} for ${url}`);
          result = await crawlUrl(url, req, repo);
        }

        const icon = result.status === 'SUCCESS' ? 'OK' : result.status === 'SKIPPED' ? 'SKIP' : 'FAIL';
        console.log(`[trawl-runner] ${icon} [${i + batch.indexOf(url) + 1}/${urls.length}] ${url} (${result.duration_ms}ms)`);

        if (config?.rate_limit_ms) {
          await new Promise((r) => setTimeout(r, config.rate_limit_ms));
        }
        return result;
      }),
    );

    results.push(...batchResults);
    if (i + concurrency < urls.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  await finalizeRunRecord(runId, results, startMs);

  const succeeded = results.filter((r) => r.status === 'SUCCESS').length;
  const failed    = results.filter((r) => r.status === 'FAILED').length;
  const skipped   = results.filter((r) => r.status === 'SKIPPED').length;
  const durationMs = Date.now() - startMs;
  const status = failed === results.length ? 'FAILED' : failed > 0 || skipped > 0 ? 'PARTIAL' : 'COMPLETE';

  console.log(`\n[trawl-runner] Run ${runId} ${status}`);
  console.log(`[trawl-runner] OK ${succeeded}  FAIL ${failed}  SKIP ${skipped}  ${(durationMs / 1000).toFixed(1)}s`);

  return { run_id: runId, status, urls_requested: urls.length, urls_succeeded: succeeded, urls_failed: failed, urls_skipped: skipped, duration_ms: durationMs, results };
}

import type { TrawlSource, TrawlSourceInsert, TrawlSourceDomain, TrawlScreenshot, TrawlScreenshotInsert } from '../trawl/types';
import { getDesignSupabase, DESIGN_SCHEMA } from './supabase';

export class TrawlRepository {
  private get db() {
    const client = getDesignSupabase();
    if (!client) throw new Error('[TrawlRepository] Supabase client not available.');
    return client.schema(DESIGN_SCHEMA);
  }

  async insertSource(source: TrawlSourceInsert): Promise<TrawlSource> {
    const { data, error } = await this.db
      .from('trawl_sources')
      .upsert(source, { onConflict: 'source_url' })
      .select()
      .single();
    if (error) throw new Error(`[TrawlRepository] insertSource failed: ${error.message}`);
    return data as TrawlSource;
  }

  async findByDomain(domain: TrawlSourceDomain, limit = 50): Promise<TrawlSource[]> {
    const { data, error } = await this.db
      .from('trawl_sources')
      .select('*')
      .eq('source_domain', domain)
      .order('captured_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(`[TrawlRepository] findByDomain failed: ${error.message}`);
    return (data ?? []) as TrawlSource[];
  }

  async findByVibe(tags: string[], limit = 50): Promise<TrawlSource[]> {
    const { data, error } = await this.db
      .from('trawl_sources')
      .select('*')
      .overlaps('vibe_tags', tags)
      .order('metadata_completeness', { ascending: false })
      .limit(limit);
    if (error) throw new Error(`[TrawlRepository] findByVibe failed: ${error.message}`);
    return (data ?? []) as TrawlSource[];
  }

  async findByPalette(targetHex: string, limit = 50): Promise<TrawlSource[]> {
    const { data, error } = await this.db
      .from('trawl_sources')
      .select('*')
      .eq('primary_color_hex', targetHex)
      .order('captured_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(`[TrawlRepository] findByPalette failed: ${error.message}`);
    return (data ?? []) as TrawlSource[];
  }

  async findByFont(fontFamily: string, limit = 50): Promise<TrawlSource[]> {
    const { data, error } = await this.db
      .from('trawl_sources')
      .select('*')
      .eq('primary_font_family', fontFamily)
      .order('captured_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(`[TrawlRepository] findByFont failed: ${error.message}`);
    return (data ?? []) as TrawlSource[];
  }

  async insertScreenshot(screenshot: TrawlScreenshotInsert): Promise<TrawlScreenshot> {
    const existing = await this.findScreenshotByPHash(screenshot.perceptual_hash);
    if (existing) return existing;

    const { data, error } = await this.db
      .from('trawl_screenshots')
      .insert(screenshot)
      .select()
      .single();
    if (error) throw new Error(`[TrawlRepository] insertScreenshot failed: ${error.message}`);
    return data as TrawlScreenshot;
  }

  async findScreenshotByPHash(phash: string): Promise<TrawlScreenshot | null> {
    const { data, error } = await this.db
      .from('trawl_screenshots')
      .select('*')
      .eq('perceptual_hash', phash)
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`[TrawlRepository] findScreenshotByPHash failed: ${error.message}`);
    return (data as TrawlScreenshot) ?? null;
  }

  async getScreenshotForSource(sourceId: string): Promise<TrawlScreenshot | null> {
    const { data, error } = await this.db
      .from('trawl_screenshots')
      .select('*')
      .eq('source_id', sourceId)
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`[TrawlRepository] getScreenshotForSource failed: ${error.message}`);
    return (data as TrawlScreenshot) ?? null;
  }
}

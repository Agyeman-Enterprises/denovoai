-- Design Studio: screen inventory + generated TSX variants per session

CREATE TABLE IF NOT EXISTS design.screens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  name         text NOT NULL,
  purpose      text NOT NULL,
  screen_type  text NOT NULL DEFAULT 'main'
               CHECK (screen_type IN ('main','alternative','error','empty',
                                      'confirmation','mobile','onboarding')),
  position     int NOT NULL DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS design.variants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id     uuid NOT NULL REFERENCES design.screens(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,
  html_preview  text,
  is_active     boolean NOT NULL DEFAULT true,
  prompt_used   text,
  model_used    text,
  trawl_sources jsonb,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS screens_session_idx ON design.screens(session_id);
CREATE INDEX IF NOT EXISTS screens_position_idx ON design.screens(session_id, position);
CREATE INDEX IF NOT EXISTS variants_screen_idx  ON design.variants(screen_id);
CREATE INDEX IF NOT EXISTS variants_active_idx  ON design.variants(screen_id, is_active);

ALTER TABLE design.screens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE design.variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own screens" ON design.screens USING (
  session_id IN (SELECT id FROM public.sessions WHERE user_id = auth.uid())
);

CREATE POLICY "own variants" ON design.variants USING (
  screen_id IN (
    SELECT s.id FROM design.screens s
    JOIN public.sessions ss ON ss.id = s.session_id
    WHERE ss.user_id = auth.uid()
  )
);

CREATE POLICY "service_role_all_screens"  ON design.screens  FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_variants" ON design.variants FOR ALL TO service_role USING (true);

-- AE: billing-usage-metering
CREATE TABLE IF NOT EXISTS public.usage_records (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature    text        NOT NULL,   -- e.g. 'ai_tokens', 'api_calls', 'seats'
  quantity   int         NOT NULL DEFAULT 1,
  period     text        NOT NULL,   -- YYYY-MM (monthly bucket)
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_user_feature_period
  ON public.usage_records (user_id, feature, period);

ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_records: user read own" ON public.usage_records
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

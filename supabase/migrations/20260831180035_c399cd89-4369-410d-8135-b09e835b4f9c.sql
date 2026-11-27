CREATE TABLE public.roof_training (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL,
  image_path text,
  notes text NOT NULL DEFAULT '',
  sketch jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roof_training TO authenticated;
GRANT ALL ON public.roof_training TO service_role;
ALTER TABLE public.roof_training ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage roof training" ON public.roof_training FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER roof_training_updated_at BEFORE UPDATE ON public.roof_training FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "admins read training images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'aerials' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins upload training images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'aerials' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins delete training images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'aerials' AND has_role(auth.uid(), 'admin'::app_role));
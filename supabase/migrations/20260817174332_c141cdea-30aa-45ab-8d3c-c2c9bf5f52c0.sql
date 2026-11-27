-- Setting to store the configurable gutter image shown in the Solutions section
INSERT INTO public.site_settings (key, value, label) VALUES
  ('solutions_image_url', '', 'Solutions section gutter image URL')
ON CONFLICT (key) DO NOTHING;

-- Public read access for site images
CREATE POLICY "Public read site-images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'site-images');

-- Admin write access for site images
CREATE POLICY "Admins upload site-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'site-images'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins update site-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'site-images'
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'site-images'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins delete site-images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'site-images'
  AND public.has_role(auth.uid(), 'admin')
);
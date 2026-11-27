CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  body text NOT NULL,
  source text NOT NULL DEFAULT 'Google',
  city text,
  review_date date NOT NULL DEFAULT current_date,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads published reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "admins manage reviews" ON public.reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage settings" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.pricing (
  key text PRIMARY KEY,
  label text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'ft',
  category text NOT NULL DEFAULT 'gutter',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pricing TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing TO authenticated;
GRANT ALL ON public.pricing TO service_role;
ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads pricing" ON public.pricing FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage pricing" ON public.pricing FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER pricing_updated_at BEFORE UPDATE ON public.pricing FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text,
  city text,
  service text NOT NULL,
  message text,
  mode text NOT NULL DEFAULT 'inspection',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  estimate numeric(12,2),
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.quote_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_requests TO authenticated;
GRANT ALL ON public.quote_requests TO service_role;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone submits quote requests" ON public.quote_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins manage quote requests" ON public.quote_requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.pricing (key, label, price, unit, category) VALUES
  ('gutter_kstyle_6', 'K Style 6 inch', 6.50, 'ft', 'gutter'),
  ('gutter_kstyle_7', 'K Style 7 inch', 7.50, 'ft', 'gutter'),
  ('gutter_kstyle_8', 'K Style 8 inch', 15.00, 'ft', 'gutter'),
  ('gutter_square_6', 'Square 6 inch', 10.00, 'ft', 'gutter'),
  ('gutter_square_7', 'Square 7 inch', 14.00, 'ft', 'gutter'),
  ('gutter_flatface_6', 'Flat Face 6 inch', 10.00, 'ft', 'gutter'),
  ('gutter_flatface_7', 'Flat Face 7 inch', 13.00, 'ft', 'gutter'),
  ('gutter_flatface_8', 'Flat Face 8 inch', 15.00, 'ft', 'gutter'),
  ('downspout_3x4', 'Downspout 3x4 corrugated', 6.30, 'ft', 'downspout'),
  ('downspout_4x5', 'Downspout 4x5 corrugated', 12.00, 'ft', 'downspout');

INSERT INTO public.site_settings (key, value, label) VALUES
  ('corner_feet', '3', 'Feet counted per gutter corner'),
  ('feet_per_downspout', '50', 'Gutter feet covered by one downspout'),
  ('downspout_feet_per_story', '15', 'Downspout feet per story'),
  ('stat_jobs', '1200', 'Completed jobs counter'),
  ('stat_rating', '5.0', 'Average rating'),
  ('stat_reviews', '180', 'Total reviews'),
  ('stat_response', '15', 'Average response time in minutes'),
  ('license', '#21BS0090', 'License number'),
  ('phone', '(754) 484-3871', 'Phone number'),
  ('email', 'business@metalflowllc.com', 'Contact email'),
  ('google_review_url', 'https://www.google.com/search?q=MetalFlow+LLC', 'Google reviews link');

INSERT INTO public.reviews (author, rating, body, source, city, sort_order) VALUES
  ('Maria S.', 5, 'They quoted my seamless gutters the same day and installed two days later. Clean work and no surprises on the price.', 'Google', 'Coral Springs', 1),
  ('James R.', 5, 'The instant quote tool matched the final price exactly. Crew was on time and the leaf guard install looks perfect.', 'Google', 'Fort Lauderdale', 2),
  ('Ana P.', 5, 'Fast response, licensed team and a real warranty. My 7 inch gutters handle heavy rain with no overflow now.', 'Google', 'Miami', 3);
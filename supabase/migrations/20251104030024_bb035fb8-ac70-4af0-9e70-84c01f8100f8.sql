-- Create table to track login attempts for security
CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  attempted_at timestamp with time zone NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false,
  ip_address text
);

-- Create index for faster lookups
CREATE INDEX idx_login_attempts_email ON public.login_attempts(email, attempted_at DESC);

-- Add price history table for AI price prediction
CREATE TABLE public.price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  category product_category NOT NULL,
  location text NOT NULL,
  price numeric NOT NULL,
  recorded_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_price_history_category_location ON public.price_history(category, location);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Login attempts are only viewable by admins (for security monitoring)
CREATE POLICY "Admins can view login attempts"
ON public.login_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Price history viewable by everyone for transparency
CREATE POLICY "Price history viewable by everyone"
ON public.price_history
FOR SELECT
USING (true);

-- System can insert login attempts (will be done via service role)
-- Price history auto-populated via trigger when products are created/updated
CREATE OR REPLACE FUNCTION public.record_price_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.price_history (product_id, category, location, price)
  VALUES (NEW.id, NEW.category, NEW.location, NEW.price);
  RETURN NEW;
END;
$$;

CREATE TRIGGER record_product_price
AFTER INSERT OR UPDATE OF price ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.record_price_history();
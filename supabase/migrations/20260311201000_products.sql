-- Products: marketplace listings (farmer-centric)
-- This table replaces Convex 'products' and is keyed by Supabase UUID (auth.users.id)

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  quantity NUMERIC(12, 3) NOT NULL CHECK (quantity >= 0),
  unit TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  image_url TEXT,
  image_storage_path TEXT, -- optional Supabase Storage path
  is_available BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ, -- best-before/end-of-sale
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for marketplace performance
CREATE INDEX IF NOT EXISTS idx_products_farmer_id ON public.products(farmer_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_location ON public.products(location);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON public.products(is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured, featured_until) WHERE is_featured = true AND (featured_until IS NULL OR featured_until > now());

-- Full-text search (pg_trgm)
CREATE INDEX IF NOT EXISTS idx_products_name_fts ON public.products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_fts ON public.products USING gin(description gin_trgm_ops);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY IF NOT EXISTS "Products are readable by all" ON public.products
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Farmers can insert own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY IF NOT EXISTS "Farmers can update own products" ON public.products
  FOR UPDATE USING (auth.uid() = farmer_id) WITH CHECK (auth.uid() = farmer_id);

CREATE POLICY IF NOT EXISTS "Farmers can delete own products" ON public.products
  FOR DELETE USING (auth.uid() = farmer_id);

-- Updated-at trigger
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper to fetch products with optional filters (used by frontend RPC if needed)
CREATE OR REPLACE FUNCTION public.list_products(
  p_category TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 40,
  p_cursor TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  farmer_id UUID,
  name TEXT,
  description TEXT,
  price NUMERIC,
  quantity NUMERIC,
  unit TEXT,
  category TEXT,
  location TEXT,
  image_url TEXT,
  is_available BOOLEAN,
  is_featured BOOLEAN,
  featured_until TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  currency TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.farmer_id,
    p.name,
    p.description,
    p.price,
    p.quantity,
    p.unit,
    p.category,
    p.location,
    p.image_url,
    p.is_available,
    p.is_featured,
    p.featured_until,
    p.expiry_date,
    p.currency,
    p.created_at,
    p.updated_at
  FROM public.products p
  WHERE
    (p_category IS NULL OR p.category = p_category)
    AND (p_search IS NULL OR (p.name % p_search OR p.description % p_search))
    AND (p_cursor IS NULL OR p.created_at < p_cursor)
    AND p.is_available = true
    AND p.quantity > 0
    AND (p.expiry_date IS NULL OR p.expiry_date > now())
    AND NOT p.is_hidden
  ORDER BY
    CASE WHEN p.is_featured = true AND (p.featured_until IS NULL OR p.featured_until > now()) THEN 0 ELSE 1 END,
    p.created_at DESC
  LIMIT p_limit;
END;
$$;

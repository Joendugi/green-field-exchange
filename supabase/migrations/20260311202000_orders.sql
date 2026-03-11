-- Orders and core commerce tables
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  total_price NUMERIC NOT NULL CHECK (total_price >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
  escrow_status TEXT DEFAULT NULL CHECK (escrow_status IS NULL OR escrow_status IN ('pending', 'held', 'released', 'refunded')),
  payment_type TEXT NOT NULL DEFAULT 'cash_on_delivery' CHECK (payment_type IN ('cash_on_delivery', 'mobile_money', 'bank_transfer', 'wallet')),
  delivery_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_farmer_id ON orders(farmer_id);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Offers table for negotiations
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  amount_per_unit NUMERIC NOT NULL CHECK (amount_per_unit >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  last_offered_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offers_product_id ON offers(product_id);
CREATE INDEX idx_offers_buyer_id ON offers(buyer_id);
CREATE INDEX idx_offers_farmer_id ON offers(farmer_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_created_at ON offers(created_at DESC);

-- Loyalty discounts for repeat buyers
CREATE TABLE IF NOT EXISTS loyalty_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discount_percentage NUMERIC NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  order_count_threshold INTEGER NOT NULL CHECK (order_count_threshold > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_loyalty_discounts_unique ON loyalty_discounts(farmer_id, buyer_id);
CREATE INDEX idx_loyalty_discounts_farmer_id ON loyalty_discounts(farmer_id);
CREATE INDEX idx_loyalty_discounts_buyer_id ON loyalty_discounts(buyer_id);

-- RLS Policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_discounts ENABLE ROW LEVEL SECURITY;

-- Orders RLS
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = farmer_id);

CREATE POLICY "Farmers can update order status" ON orders
  FOR UPDATE USING (auth.uid() = farmer_id AND status IN ('pending', 'accepted'));

CREATE POLICY "Buyers can cancel pending orders" ON orders
  FOR UPDATE USING (auth.uid() = buyer_id AND status = 'pending');

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Offers RLS
CREATE POLICY "Users can view own offers" ON offers
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = farmer_id);

CREATE POLICY "Buyers can create offers" ON offers
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Farmers can update offers" ON offers
  FOR UPDATE USING (auth.uid() = farmer_id);

CREATE POLICY "Users can update own offers" ON offers
  FOR UPDATE USING (auth.uid() = last_offered_by);

-- Loyalty Discounts RLS
CREATE POLICY "Farmers can manage loyalty discounts" ON loyalty_discounts
  FOR ALL USING (auth.uid() = farmer_id);

CREATE POLICY "Buyers can view own loyalty discounts" ON loyalty_discounts
  FOR SELECT USING (auth.uid() = buyer_id);

-- Functions
CREATE OR REPLACE FUNCTION get_my_orders(p_status TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  buyer_id UUID,
  farmer_id UUID,
  product_id UUID,
  quantity NUMERIC,
  total_price NUMERIC,
  currency TEXT,
  status TEXT,
  escrow_status TEXT,
  payment_type TEXT,
  delivery_address TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  products_name TEXT,
  products_image_url TEXT,
  buyer_profiles_full_name TEXT,
  farmer_profiles_full_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.buyer_id,
    o.farmer_id,
    o.product_id,
    o.quantity,
    o.total_price,
    o.currency,
    o.status,
    o.escrow_status,
    o.payment_type,
    o.delivery_address,
    o.created_at,
    o.updated_at,
    p.name as products_name,
    p.image_url as products_image_url,
    bp.full_name as buyer_profiles_full_name,
    fp.full_name as farmer_profiles_full_name
  FROM orders o
  LEFT JOIN products p ON o.product_id = p.id
  LEFT JOIN profiles bp ON o.buyer_id = bp.id
  LEFT JOIN profiles fp ON o.farmer_id = fp.id
  WHERE (o.buyer_id = auth.uid() OR o.farmer_id = auth.uid())
    AND (p_status IS NULL OR o.status = p_status)
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_offers(p_status TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  product_id UUID,
  buyer_id UUID,
  farmer_id UUID,
  quantity NUMERIC,
  amount_per_unit NUMERIC,
  status TEXT,
  last_offered_by UUID,
  message TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  products_name TEXT,
  products_image_url TEXT,
  buyer_profiles_full_name TEXT,
  farmer_profiles_full_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    of.id,
    of.product_id,
    of.buyer_id,
    of.farmer_id,
    of.quantity,
    of.amount_per_unit,
    of.status,
    of.last_offered_by,
    of.message,
    of.created_at,
    of.updated_at,
    p.name as products_name,
    p.image_url as products_image_url,
    bp.full_name as buyer_profiles_full_name,
    fp.full_name as farmer_profiles_full_name
  FROM offers of
  LEFT JOIN products p ON of.product_id = p.id
  LEFT JOIN profiles bp ON of.buyer_id = bp.id
  LEFT JOIN profiles fp ON of.farmer_id = fp.id
  WHERE (of.buyer_id = auth.uid() OR of.farmer_id = auth.uid())
    AND (p_status IS NULL OR of.status = p_status)
  ORDER BY of.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION trigger_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_timestamp();

CREATE TRIGGER offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_timestamp();

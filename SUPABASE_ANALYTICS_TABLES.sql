-- ==========================================
-- 8. ANALYTICS & AI TABLES (Missing from previous migration)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.search_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    category TEXT,
    location TEXT,
    user_id UUID REFERENCES auth.users(id),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.loyalty_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES auth.users(id),
    buyer_id UUID NOT NULL REFERENCES auth.users(id),
    discount_percentage DECIMAL(5,2) DEFAULT 10,
    order_count_threshold INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(farmer_id, buyer_id)
);

CREATE TABLE IF NOT EXISTS public.ai_chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Search logs viewable by all" ON public.search_logs FOR SELECT USING (true);
CREATE POLICY "Users can insert search logs" ON public.search_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own loyalty discounts" ON public.loyalty_discounts FOR SELECT USING (auth.uid() = farmer_id OR auth.uid() = buyer_id);
CREATE POLICY "Farmers can manage own loyalty discounts" ON public.loyalty_discounts FOR ALL USING (auth.uid() = farmer_id);

CREATE POLICY "Users can manage own AI chat history" ON public.ai_chat_history FOR ALL USING (auth.uid() = user_id);

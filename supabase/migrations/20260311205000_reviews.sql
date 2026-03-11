-- Reviews and ratings system
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  rating NUMERIC NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_product_review UNIQUE (reviewer_id, product_id),
  CONSTRAINT no_self_review CHECK (reviewer_id != reviewee_id)
);

CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- Aggregate view for product ratings
CREATE MATERIALIZED VIEW IF NOT EXISTS product_ratings AS
SELECT 
  p.id as product_id,
  COUNT(r.id) as review_count,
  COALESCE(AVG(r.rating), 0) as average_rating,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'rating', r.rating,
        'comment', r.comment,
        'created_at', r.created_at,
        'reviewer_id', r.reviewer_id,
        'reviewer_name', rp.full_name
      ) ORDER BY r.created_at DESC
    ) FILTER (WHERE r.id IS NOT NULL),
    '[]'::jsonb
  ) as reviews
FROM products p
LEFT JOIN reviews r ON p.id = r.product_id
LEFT JOIN profiles rp ON r.reviewer_id = rp.id
GROUP BY p.id;

CREATE UNIQUE INDEX idx_product_ratings_product_id ON product_ratings(product_id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_product_ratings()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY product_ratings;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all reviews" ON reviews
  FOR SELECT USING (true); -- Reviews are public

CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (
    reviewer_id = auth.uid() AND
    reviewer_id != reviewee_id
  );

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (reviewer_id = auth.uid());

CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE USING (reviewer_id = auth.uid());

-- Functions
CREATE OR REPLACE FUNCTION get_product_reviews(p_product_id UUID)
RETURNS TABLE (
  id UUID,
  reviewer_id UUID,
  reviewee_id UUID,
  product_id UUID,
  rating NUMERIC,
  comment TEXT,
  created_at TIMESTAMPTZ,
  reviewer_full_name TEXT,
  reviewer_avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.reviewer_id,
    r.reviewee_id,
    r.product_id,
    r.rating,
    r.comment,
    r.created_at,
    p.full_name as reviewer_full_name,
    p.avatar_url as reviewer_avatar_url
  FROM reviews r
  LEFT JOIN profiles p ON r.reviewer_id = p.id
  WHERE r.product_id = p_product_id
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_reviews(p_given BOOLEAN DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  reviewer_id UUID,
  reviewee_id UUID,
  product_id UUID,
  rating NUMERIC,
  comment TEXT,
  created_at TIMESTAMPTZ,
  product_name TEXT,
  product_image_url TEXT,
  reviewee_full_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.reviewer_id,
    r.reviewee_id,
    r.product_id,
    r.rating,
    r.comment,
    r.created_at,
    p.name as product_name,
    p.image_url as product_image_url,
    rp.full_name as reviewee_full_name
  FROM reviews r
  LEFT JOIN products p ON r.product_id = p.id
  LEFT JOIN profiles rp ON r.reviewee_id = rp.id
  WHERE r.reviewer_id = auth.uid()
    AND (p_given IS NULL OR (p_given AND r.reviewee_id != auth.uid()) OR (NOT p_given AND r.reviewee_id = auth.uid()))
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_or_update_review(
  p_product_id UUID,
  p_reviewee_id UUID,
  p_rating NUMERIC,
  p_comment TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_review_id UUID;
  v_existing_id UUID;
BEGIN
  -- Check for existing review
  SELECT id INTO v_existing_id
  FROM reviews
  WHERE reviewer_id = auth.uid()
    AND product_id = p_product_id;

  IF v_existing_id IS NOT NULL THEN
    -- Update existing review
    UPDATE reviews
    SET 
      rating = p_rating,
      comment = p_comment,
      reviewee_id = p_reviewee_id
    WHERE id = v_existing_id
    RETURNING id INTO v_review_id;
  ELSE
    -- Create new review
    INSERT INTO reviews (reviewer_id, reviewee_id, product_id, rating, comment)
    VALUES (auth.uid(), p_reviewee_id, p_product_id, p_rating, p_comment)
    RETURNING id INTO v_review_id;
  END IF;

  -- Refresh product ratings asynchronously
  PERFORM pg_notify('refresh_product_ratings', p_product_id::text);

  RETURN v_review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_average_rating(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_avg_rating NUMERIC;
BEGIN
  SELECT COALESCE(AVG(rating), 0) INTO v_avg_rating
  FROM reviews
  WHERE reviewee_id = p_user_id;

  RETURN v_avg_rating;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove old check constraints
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_escrow_status_check;

-- Add updated check constraints to support complete status, delivery tracking, and escrow dispute flows
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled', 'dispatched', 'in_transit', 'disputed'));

ALTER TABLE public.orders ADD CONSTRAINT orders_escrow_status_check 
  CHECK (escrow_status IS NULL OR escrow_status IN ('pending', 'awaiting_payment', 'held', 'released', 'refunded', 'disputed'));

-- 0.3.1
ALTER TABLE public.order_line
ADD COLUMN discount DECIMAL(10,2) NOT NULL DEFAULT 0.0,
ADD COLUMN net_total_price DECIMAL(10,2) NOT NULL DEFAULT 0.0;

ALTER TABLE public.order_line
RENAME COLUMN total_price TO gross_total_price;

-- Migrate net_total_price
UPDATE public.order_line
SET net_total_price = gross_total_price - discount;
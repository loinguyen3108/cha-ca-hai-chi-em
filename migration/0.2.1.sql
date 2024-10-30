ALTER TABLE public.importer
ADD COLUMN other_expenses NUMERIC(10, 2) DEFAULT 0.00;

COMMENT ON COLUMN public.import_line.total_price IS 'Total price do not include other expenses';
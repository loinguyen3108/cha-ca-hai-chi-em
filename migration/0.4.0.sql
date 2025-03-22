CREATE INDEX idx_importer_imported_at ON public.importer USING BTREE(imported_at DESC);
CREATE INDEX idx_order_order_at ON public.order USING BTREE(order_at DESC);
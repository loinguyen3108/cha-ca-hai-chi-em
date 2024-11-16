-- 0.3.0
CREATE TABLE IF NOT EXISTS public.customer (
    id          SERIAL        PRIMARY KEY,
    name        TEXT          NOT NULL,
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_lower_name ON public.customer (LOWER(name));

CREATE TABLE IF NOT EXISTS public.order (
    id            SERIAL        PRIMARY KEY,
    customer_id   INTEGER       NOT NULL,
    created_by    INTEGER       NOT NULL,
    order_at      DATE          NOT NULL DEFAULT NOW(),
    status        SMALLINT      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    FOREIGN KEY (customer_id) REFERENCES public.customer (id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES public.users (id) ON DELETE CASCADE ON UPDATE CASCADE
);
COMMENT ON TABLE public.order IS 'The `status` field is used to track the status of the order. 0 = Pending, 1 = success';

CREATE TABLE IF NOT EXISTS public.order_line (
    order_id      INTEGER       NOT NULL,
    product_id    INTEGER       NOT NULL,
    quantity      INTEGER       NOT NULL,
    sale_price    DECIMAL(10,2) NOT NULL,
    total_price   DECIMAL(10,2) NOT NULL,
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (order_id) REFERENCES public.order (id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES public.product (id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Insert customer data
INSERT INTO public.customer (id, name)
VALUES (-1, 'Anonymous');
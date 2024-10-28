-- 0.2.0
CREATE TABLE IF NOT EXISTS public.product (
    id            SERIAL          PRIMARY KEY,
    created_at    TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP       NOT NULL DEFAULT NOW(),
    sku           VARCHAR(255)    NOT NULL,
    name          VARCHAR(255)    NOT NULL,
    unit_price    DECIMAL(10, 2)  NOT NULL,
    sale_price    DECIMAL(10, 2)  NOT NULL,
    description   TEXT,
    image_url     TEXT            NOT NULL,
    stock_quantity INTEGER        NOT NULL  DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS product_upper_sku ON public.product (sku);


CREATE TABLE IF NOT EXISTS public.importer (
    id            SERIAL          PRIMARY KEY,
    created_at    TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP       NOT NULL DEFAULT NOW(),
    imported_at   DATE            NOT NULL,
    imported_by   INTEGER         NOT NULL,
    status        SMALLINT        NOT NULL  DEFAULT 0
);
CREATE INDEX IF NOT EXISTS importer_imported_at ON public.importer (imported_at);


CREATE TABLE IF NOT EXISTS public.import_line (
    importer_id   INTEGER         NOT NULL,
    product_id    INTEGER         NOT NULL,
    created_at    TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP       NOT NULL DEFAULT NOW(),
    quantity      INTEGER         NOT NULL,
    unit_price    DECIMAL(10, 2)  NOT NULL,
    total_price   DECIMAL(10, 2)  NOT NULL,
    PRIMARY KEY (importer_id, product_id),
    FOREIGN KEY (importer_id) REFERENCES public.importer (id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES public.product (id) ON DELETE CASCADE ON UPDATE CASCADE
);

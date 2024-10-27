-- 0.1.0
CREATE TABLE public.users (
  id          SERIAL        PRIMARY KEY,
  username    VARCHAR(80)   NOT NULL,
  password    TEXT          NOT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX users_lower_username ON public.users (LOWER(username));
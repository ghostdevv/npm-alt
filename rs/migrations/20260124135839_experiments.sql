CREATE TABLE "public"."packages" (
    id text NOT NULL,
    rev text NOT NULL,
    CONSTRAINT "pk_packages" PRIMARY KEY ("id")
);

CREATE TABLE "public"."state" (
    key text NOT NULL,
    value text NOT NULL,
    CONSTRAINT "pk_state" PRIMARY KEY ("key")
);

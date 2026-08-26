-- Esquema real de la base de datos de Millys (Neon / PostgreSQL).
--
-- Documento de referencia, no una migración ejecutable ni versionada por
-- Flyway/Liquibase: las tablas ya existen en Neon, creadas a mano con psql
-- a medida que se fueron añadiendo features. Este archivo es solo un
-- volcado fiel de `\d+` sobre la base real (2026-08-27), para poder
-- recrear el esquema desde cero si hiciera falta (nuevo entorno, disaster
-- recovery, etc.) sin depender de que Neon siga viva.
--
-- Si cambias el esquema en producción, actualiza este archivo a mano.

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    nombre        TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    test          BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE categories (
    id                  BIGSERIAL PRIMARY KEY,
    code                VARCHAR(50) NOT NULL UNIQUE,
    label               VARCHAR(100) NOT NULL,
    color               CHAR(7) NOT NULL,
    is_default          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    no_description      BOOLEAN NOT NULL DEFAULT FALSE,
    financing_category  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE installment_plans (
    id                   BIGSERIAL PRIMARY KEY,
    user_id              BIGINT NOT NULL REFERENCES users(id),
    description          VARCHAR(200) NOT NULL,
    total_amount         NUMERIC(10,2) NOT NULL,
    monthly_amount       NUMERIC(10,2) NOT NULL,
    start_date           DATE NOT NULL,
    initial_paid_amount  NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE expenses (
    id                    BIGSERIAL PRIMARY KEY,
    user_id               BIGINT NOT NULL REFERENCES users(id),
    category_code         VARCHAR(50) NOT NULL,
    description           VARCHAR(200) NOT NULL DEFAULT '',
    amount                NUMERIC(10,2) NOT NULL,
    date                  DATE NOT NULL,
    installment_plan_id   BIGINT REFERENCES installment_plans(id) ON DELETE SET NULL,
    shared                BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE incomes (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id),
    description  VARCHAR(200) NOT NULL DEFAULT '',
    amount       NUMERIC(10,2) NOT NULL,
    date         DATE NOT NULL
);

CREATE TABLE savings_entries (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT NOT NULL REFERENCES users(id),
    destination_code  VARCHAR(50) NOT NULL,
    description       VARCHAR(200) NOT NULL DEFAULT '',
    amount            NUMERIC(10,2) NOT NULL,
    date              DATE NOT NULL
);

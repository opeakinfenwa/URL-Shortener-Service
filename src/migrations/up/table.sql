CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    google_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password VARCHAR(255),

    auth_provider VARCHAR(50) NOT NULL DEFAULT 'local',

    security_question VARCHAR(255),
    security_answer VARCHAR(255),

    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE TABLE IF NOT EXISTS short_urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    "shortCode" VARCHAR(255) UNIQUE NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "clickCount" INTEGER NOT NULL DEFAULT 0,

    "userId" UUID,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,

    CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);
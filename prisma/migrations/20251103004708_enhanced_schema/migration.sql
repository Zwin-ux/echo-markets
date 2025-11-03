/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "ticks" ADD COLUMN     "ask" DOUBLE PRECISION,
ADD COLUMN     "bid" DOUBLE PRECISION,
ADD COLUMN     "change_24h" DOUBLE PRECISION,
ADD COLUMN     "change_percent_24h" DOUBLE PRECISION,
ADD COLUMN     "volatility" DOUBLE PRECISION,
ALTER COLUMN "volume" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "last_active" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "preferences" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "username" TEXT;

-- CreateTable
CREATE TABLE "portfolios" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_date" DATE NOT NULL,
    "starting_cash" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "current_cash" DOUBLE PRECISION,
    "total_value" DOUBLE PRECISION,
    "day_change" DOUBLE PRECISION,
    "day_change_percent" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_value" DOUBLE PRECISION,
    "current_progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "QuestStatus" NOT NULL DEFAULT 'ACTIVE',
    "reward_type" TEXT,
    "reward_value" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_date" DATE NOT NULL,
    "category" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "affected_symbols" TEXT[],
    "impact_magnitude" DOUBLE PRECISION,
    "sentiment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "portfolios_user_id_idx" ON "portfolios"("user_id");

-- CreateIndex
CREATE INDEX "portfolios_session_date_idx" ON "portfolios"("session_date");

-- CreateIndex
CREATE UNIQUE INDEX "portfolios_user_id_session_date_key" ON "portfolios"("user_id", "session_date");

-- CreateIndex
CREATE INDEX "quests_user_id_idx" ON "quests"("user_id");

-- CreateIndex
CREATE INDEX "quests_status_idx" ON "quests"("status");

-- CreateIndex
CREATE INDEX "quests_expires_at_idx" ON "quests"("expires_at");

-- CreateIndex
CREATE INDEX "leaderboard_entries_session_date_category_idx" ON "leaderboard_entries"("session_date", "category");

-- CreateIndex
CREATE INDEX "leaderboard_entries_category_score_idx" ON "leaderboard_entries"("category", "score");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_entries_user_id_session_date_category_key" ON "leaderboard_entries"("user_id", "session_date", "category");

-- CreateIndex
CREATE INDEX "market_events_type_idx" ON "market_events"("type");

-- CreateIndex
CREATE INDEX "market_events_created_at_idx" ON "market_events"("created_at");

-- CreateIndex
CREATE INDEX "ticks_symbol_timestamp_idx" ON "ticks"("symbol", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quests" ADD CONSTRAINT "quests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

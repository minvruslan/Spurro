ALTER TYPE "public"."server_status" ADD VALUE 'failed' BEFORE 'deleted';--> statement-breakpoint
ALTER TABLE "server" ADD COLUMN "config" jsonb;
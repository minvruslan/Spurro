DELETE FROM "config" WHERE "status" = 'deleted';--> statement-breakpoint
DROP INDEX "config_endpoint_client_identifier_uq";--> statement-breakpoint
ALTER TABLE "config" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "config" ALTER COLUMN "status" SET DEFAULT 'pending'::text;--> statement-breakpoint
DROP TYPE "public"."config_status";--> statement-breakpoint
CREATE TYPE "public"."config_status" AS ENUM('active', 'pending', 'deleting');--> statement-breakpoint
ALTER TABLE "config" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."config_status";--> statement-breakpoint
ALTER TABLE "config" ALTER COLUMN "status" SET DATA TYPE "public"."config_status" USING "status"::"public"."config_status";--> statement-breakpoint
CREATE UNIQUE INDEX "config_endpoint_client_identifier_uq" ON "config" USING btree ("endpoint_id","client_identifier");

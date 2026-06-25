ALTER TYPE "public"."server_status" ADD VALUE 'deleted';--> statement-breakpoint
DROP INDEX "endpoint_server_port_uq";--> statement-breakpoint
ALTER TABLE "endpoint" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "endpoint" ALTER COLUMN "status" SET DEFAULT 'active'::text;--> statement-breakpoint
DROP TYPE "public"."endpoint_status";--> statement-breakpoint
CREATE TYPE "public"."endpoint_status" AS ENUM('active', 'deleted');--> statement-breakpoint
ALTER TABLE "endpoint" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."endpoint_status";--> statement-breakpoint
ALTER TABLE "endpoint" ALTER COLUMN "status" SET DATA TYPE "public"."endpoint_status" USING "status"::"public"."endpoint_status";--> statement-breakpoint
CREATE UNIQUE INDEX "endpoint_server_port_uq" ON "endpoint" USING btree ("server_id","port") WHERE "status" = 'active';--> statement-breakpoint
ALTER TABLE "access_grant" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "access_grant" ALTER COLUMN "status" SET DEFAULT 'active'::text;--> statement-breakpoint
DROP TYPE "public"."grant_status";--> statement-breakpoint
CREATE TYPE "public"."grant_status" AS ENUM('active', 'deleted');--> statement-breakpoint
ALTER TABLE "access_grant" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."grant_status";--> statement-breakpoint
ALTER TABLE "access_grant" ALTER COLUMN "status" SET DATA TYPE "public"."grant_status" USING "status"::"public"."grant_status";
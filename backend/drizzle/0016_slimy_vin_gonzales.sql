DROP INDEX "endpoint_server_port_uq";
--> statement-breakpoint
DROP INDEX "endpoint_server_protocol_uq";
--> statement-breakpoint
ALTER TABLE "endpoint" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "endpoint" ALTER COLUMN "status" SET DEFAULT 'active'::text;--> statement-breakpoint
DROP TYPE "public"."endpoint_status";--> statement-breakpoint
CREATE TYPE "public"."endpoint_status" AS ENUM('active');--> statement-breakpoint
ALTER TABLE "endpoint" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."endpoint_status";--> statement-breakpoint
ALTER TABLE "endpoint" ALTER COLUMN "status" SET DATA TYPE "public"."endpoint_status" USING "status"::"public"."endpoint_status";--> statement-breakpoint
ALTER TABLE "server" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "server" ALTER COLUMN "status" SET DEFAULT 'active'::text;--> statement-breakpoint
DROP TYPE "public"."server_status";--> statement-breakpoint
CREATE TYPE "public"."server_status" AS ENUM('provisioning', 'active', 'failed');--> statement-breakpoint
ALTER TABLE "server" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."server_status";--> statement-breakpoint
ALTER TABLE "server" ALTER COLUMN "status" SET DATA TYPE "public"."server_status" USING "status"::"public"."server_status";--> statement-breakpoint
CREATE UNIQUE INDEX "endpoint_server_port_uq" ON "endpoint" USING btree ("server_id","port") WHERE "status" = 'active';
--> statement-breakpoint
CREATE UNIQUE INDEX "endpoint_server_protocol_uq" ON "endpoint" USING btree ("server_id","protocol_id") WHERE "status" = 'active';

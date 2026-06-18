ALTER TABLE "endpoint" DROP CONSTRAINT "endpoint_server_port_uq";--> statement-breakpoint
ALTER TABLE "server" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "server" ALTER COLUMN "status" SET DEFAULT 'active'::text;--> statement-breakpoint
DROP TYPE "public"."server_status";--> statement-breakpoint
CREATE TYPE "public"."server_status" AS ENUM('provisioning', 'active');--> statement-breakpoint
ALTER TABLE "server" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."server_status";--> statement-breakpoint
ALTER TABLE "server" ALTER COLUMN "status" SET DATA TYPE "public"."server_status" USING "status"::"public"."server_status";--> statement-breakpoint
ALTER TABLE "server" ALTER COLUMN "ip" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "server" ADD COLUMN "domain_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "server" ADD COLUMN "is_current" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "endpoint_server_port_uq" ON "endpoint" USING btree ("server_id","port") WHERE "endpoint"."status" = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "server_is_current_uq" ON "server" USING btree ("is_current") WHERE "server"."is_current";--> statement-breakpoint
ALTER TABLE "server" DROP COLUMN "hostname";
ALTER TABLE "config" ALTER COLUMN "data" SET DATA TYPE text USING "data"::text;--> statement-breakpoint
ALTER TABLE "endpoint" ALTER COLUMN "data" SET DATA TYPE text USING "data"::text;--> statement-breakpoint
ALTER TABLE "server" ALTER COLUMN "data" SET DATA TYPE text USING "data"::text;--> statement-breakpoint
ALTER TABLE "config" ADD COLUMN "client_identifier" text;--> statement-breakpoint
CREATE UNIQUE INDEX "config_endpoint_client_identifier_uq" ON "config" USING btree ("endpoint_id","client_identifier") WHERE "config"."status" != 'deleted';
ALTER TYPE "public"."config_status" ADD VALUE 'pending' BEFORE 'deleted';--> statement-breakpoint
ALTER TYPE "public"."config_status" ADD VALUE 'deleting' BEFORE 'deleted';--> statement-breakpoint
ALTER TABLE "protocol" DROP CONSTRAINT "protocol_type_version_uq";--> statement-breakpoint
ALTER TABLE "config_limit" DROP CONSTRAINT "config_limit_user_type_uq";--> statement-breakpoint
ALTER TABLE "protocol" DROP CONSTRAINT "protocol_protocol_type_id_protocol_type_id_fk";
--> statement-breakpoint
ALTER TABLE "config_limit" DROP CONSTRAINT "config_limit_protocol_type_id_protocol_type_id_fk";
--> statement-breakpoint
DROP INDEX "protocol_type_idx";--> statement-breakpoint
ALTER TABLE "protocol_type" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "protocol_type" CASCADE;--> statement-breakpoint
ALTER TABLE "config" ALTER COLUMN "status" SET DEFAULT 'pending'::text::"public"."config_status";--> statement-breakpoint
ALTER TABLE "server" ALTER COLUMN "domain_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "protocol" ADD COLUMN "code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "protocol" ADD COLUMN "family" text NOT NULL;--> statement-breakpoint
ALTER TABLE "protocol" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "config_limit" ADD COLUMN "protocol_family" text NOT NULL;--> statement-breakpoint
ALTER TABLE "protocol" DROP COLUMN "protocol_type_id";--> statement-breakpoint
ALTER TABLE "protocol" DROP COLUMN "version";--> statement-breakpoint
ALTER TABLE "config_limit" DROP COLUMN "protocol_type_id";--> statement-breakpoint
ALTER TABLE "protocol" ADD CONSTRAINT "protocol_code_unique" UNIQUE("code");--> statement-breakpoint
ALTER TABLE "config_limit" ADD CONSTRAINT "config_limit_user_protocol_family_uq" UNIQUE("user_id","protocol_family");
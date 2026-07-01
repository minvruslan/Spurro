ALTER TYPE "public"."grant_status" RENAME TO "config_status";--> statement-breakpoint
ALTER TABLE "access_grant" RENAME TO "config";--> statement-breakpoint
ALTER TABLE "user_limit" RENAME TO "config_limit";--> statement-breakpoint
ALTER TABLE "config" RENAME COLUMN "config" TO "data";--> statement-breakpoint
ALTER TABLE "server" RENAME COLUMN "config" TO "data";--> statement-breakpoint
ALTER TABLE "endpoint" RENAME COLUMN "config" TO "data";--> statement-breakpoint
ALTER TABLE "config" RENAME CONSTRAINT "access_grant_user_id_user_id_fk" TO "config_user_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "config" RENAME CONSTRAINT "access_grant_endpoint_id_endpoint_id_fk" TO "config_endpoint_id_endpoint_id_fk";--> statement-breakpoint
ALTER TABLE "config" RENAME CONSTRAINT "access_grant_device_type_id_device_type_id_fk" TO "config_device_type_id_device_type_id_fk";--> statement-breakpoint
ALTER TABLE "config_limit" RENAME CONSTRAINT "user_limit_user_id_user_id_fk" TO "config_limit_user_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "config_limit" RENAME CONSTRAINT "user_limit_protocol_type_id_protocol_type_id_fk" TO "config_limit_protocol_type_id_protocol_type_id_fk";--> statement-breakpoint
ALTER TABLE "config_limit" RENAME CONSTRAINT "user_limit_user_type_uq" TO "config_limit_user_type_uq";--> statement-breakpoint
ALTER INDEX "access_grant_user_idx" RENAME TO "config_user_idx";--> statement-breakpoint
ALTER INDEX "access_grant_endpoint_idx" RENAME TO "config_endpoint_idx";--> statement-breakpoint
ALTER INDEX "access_grant_device_type_idx" RENAME TO "config_device_type_idx";

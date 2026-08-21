ALTER TABLE "device_type" DROP CONSTRAINT "device_type_code_check";--> statement-breakpoint
ALTER TABLE "device_type" DROP CONSTRAINT "device_type_name_check";--> statement-breakpoint
DELETE FROM "device_type" WHERE "code" = 'linux';--> statement-breakpoint
UPDATE "device_type" SET "name" = 'iOS' WHERE "code" = 'ios';--> statement-breakpoint
ALTER TABLE "device_type" ADD CONSTRAINT "device_type_code_check" CHECK ("device_type"."code" in ('ios', 'macos', 'windows', 'android'));--> statement-breakpoint
ALTER TABLE "device_type" ADD CONSTRAINT "device_type_name_check" CHECK ("device_type"."name" in ('iOS', 'macOS', 'Windows', 'Android'));

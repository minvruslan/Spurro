ALTER TABLE "device_type" DROP CONSTRAINT "device_type_code_check";--> statement-breakpoint
ALTER TABLE "device_type" DROP CONSTRAINT "device_type_name_check";--> statement-breakpoint
ALTER TABLE "device_type" ADD COLUMN "sort_order" integer;--> statement-breakpoint
UPDATE "device_type" SET "sort_order" = 1 WHERE "code" = 'ios';--> statement-breakpoint
UPDATE "device_type" SET "sort_order" = 3 WHERE "code" = 'macos';--> statement-breakpoint
UPDATE "device_type" SET "sort_order" = 4 WHERE "code" = 'android';--> statement-breakpoint
UPDATE "device_type" SET "sort_order" = 5 WHERE "code" = 'windows';--> statement-breakpoint
ALTER TABLE "device_type" ALTER COLUMN "sort_order" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "device_type" ADD CONSTRAINT "device_type_code_check" CHECK ("device_type"."code" in ('ios', 'ipados', 'macos', 'windows', 'android'));--> statement-breakpoint
ALTER TABLE "device_type" ADD CONSTRAINT "device_type_name_check" CHECK ("device_type"."name" in ('iOS', 'iPadOS', 'macOS', 'Windows', 'Android'));

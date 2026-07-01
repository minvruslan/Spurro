UPDATE "protocol_type" SET "code" = 'amneziawg' WHERE "code" = 'amnezia_wg';--> statement-breakpoint
UPDATE "config" SET "data" = jsonb_set("data", '{protocol}', '"amneziawg"') WHERE "data" ->> 'protocol' = 'amnezia_wg';

ALTER TABLE "endpoint" RENAME COLUMN "listen_port" TO "port";--> statement-breakpoint
ALTER TABLE "protocol" RENAME COLUMN "type_id" TO "protocol_type_id";--> statement-breakpoint
ALTER TABLE "server" RENAME COLUMN "public_ip" TO "ip";--> statement-breakpoint
ALTER TABLE "endpoint" DROP CONSTRAINT "endpoint_server_port_uq";--> statement-breakpoint
ALTER TABLE "protocol" DROP CONSTRAINT "protocol_type_version_uq";--> statement-breakpoint
ALTER TABLE "protocol" DROP CONSTRAINT "protocol_type_id_protocol_type_id_fk";
--> statement-breakpoint
DROP INDEX "protocol_type_idx";--> statement-breakpoint
ALTER TABLE "protocol" ADD CONSTRAINT "protocol_protocol_type_id_protocol_type_id_fk" FOREIGN KEY ("protocol_type_id") REFERENCES "public"."protocol_type"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "protocol_type_idx" ON "protocol" USING btree ("protocol_type_id");--> statement-breakpoint
ALTER TABLE "protocol" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "endpoint" ADD CONSTRAINT "endpoint_server_port_uq" UNIQUE("server_id","port");--> statement-breakpoint
ALTER TABLE "protocol" ADD CONSTRAINT "protocol_type_version_uq" UNIQUE("protocol_type_id","version");
ALTER TABLE "comments" DROP CONSTRAINT "comments_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "opportunities" DROP CONSTRAINT "opportunities_created_by_user_user_id_fk";
--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "mentors" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentors" ADD CONSTRAINT "mentors_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" DROP COLUMN "created_by_user";
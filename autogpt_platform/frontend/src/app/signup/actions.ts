"use server";
import { createServerClient } from "@/lib/supabase/server";
import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const SignupFormSchema = z.object({
  email: z.string().email().min(2).max(64),
  password: z.string().min(6).max(64),
});

export async function signup(values: z.infer<typeof SignupFormSchema>) {
  "use server";
  return await Sentry.withServerActionInstrumentation(
    "signup",
    {},
    async () => {
      const supabase = createServerClient();

      if (!supabase) {
        redirect("/error");
      }

      // We are sure that the values are of the correct type because zod validates the form
      const { data, error } = await supabase.auth.signUp(values);

      if (error) {
        if (error.message.includes("P0001")) {
          return "Please join our waitlist for your turn: https://agpt.co/waitlist";
        }
        if (error.code?.includes("user_already_exists")) {
          redirect("/login");
        }
        return error.message;
      }

      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      revalidatePath("/", "layout");
      redirect("/");
    },
  );
}

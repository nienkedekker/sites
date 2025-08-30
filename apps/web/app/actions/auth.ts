"use server";

import { encodedRedirect } from "@/utils/server/redirects";
import { isNextRedirect } from "@/utils/server/error-handling";
import { createClientForServer } from "@/utils/supabase/server";
import { validateEmail, validatePassword } from "@/utils/validators/item";
import { redirect } from "next/navigation";

export const signInAction = async (formData: FormData) => {
  try {
    const email = formData.get("email")?.toString() || "";
    const password = formData.get("password")?.toString() || "";

    // Validate email format
    if (!validateEmail(email)) {
      return encodedRedirect("error", "/sign-in", "Please enter a valid email address.");
    }

    // Basic password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.success) {
      return encodedRedirect("error", "/sign-in", passwordValidation.errors.join(", "));
    }

    const supabase = await createClientForServer();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Provide user-friendly error messages
      let errorMessage = "Unable to sign in. Please check your credentials.";
      
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Please check your email and click the confirmation link.";
      } else if (error.message.includes("Too many requests")) {
        errorMessage = "Too many sign-in attempts. Please try again later.";
      }

      console.error("Sign in error:", error.message);
      return encodedRedirect("error", "/sign-in", errorMessage);
    }

    return redirect("/");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    console.error("Unexpected error in signInAction:", error);
    return encodedRedirect("error", "/sign-in", "Something went wrong. Please try again.");
  }
};

export const signOutAction = async () => {
  const supabase = await createClientForServer();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

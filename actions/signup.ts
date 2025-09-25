"use server";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
// import { supabase } from "@/utlis/supabase/server";
import { APIError } from "better-auth";
import { eq } from "drizzle-orm";
import z from "zod";

export type SignupFormState = {
  errors?: {
    properties?: {
      firstName?: string[];
      lastName?: string[];
      email?: string[];
      password?: string[];
    };
  };
  message: string;
  success: boolean;
  timestamp: Date;
  redirectTo?: string;
};

export async function signup(prevState: SignupFormState, formData: FormData) {
  const supabase = await createClient();
  const signupSchema = z.object({
    firstName: z.string().min(1).nonempty(),
    lastName: z.string().min(1).nonempty(),
    email: z.email().nonempty(),
    password: z.string().min(1).nonempty(),
  });

  const validateFields = signupSchema.safeParse({
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (!validateFields.success) {
    const tree = z.treeifyError(validateFields.error);
    return {
      errors: {
        properties: {
          firstName: tree.properties?.firstName?.errors ?? [],
          lastName: tree.properties?.lastName?.errors ?? [],
          email: tree.properties?.email?.errors ?? [],
          password: tree.properties?.password?.errors ?? [],
        },
      },
      message: "Validation Failed!",
      success: false,
      timestamp: new Date(),
    };
  }

  const { firstName, lastName, email, password } = validateFields.data;
  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: `${firstName.toLocaleLowerCase()} ${lastName.toLocaleLowerCase()}`,
        rememberMe: true,
      },
    });

    // const { data, error } = await supabase
    //   .from("users")
    //   .update({
    //     name: `${firstName} ${lastName}`,
    //   })
    //   .eq("email", email);

    // if (error) {
    //   console.error("Error: ", error);
    //   return {
    //     errros: {},
    //     success: false,
    //     message: error.message,
    //     timestamp: new Date(),
    //   };
    // }

    return {
      errors: {},
      message: "Signed up successfully!",
      success: true,
      redirectTo: "/chat",
      timestamp: new Date(),
    };
  } catch (error) {
    if (error instanceof APIError) {
      switch (error.status) {
        case "UNPROCESSABLE_ENTITY":
          return {
            success: false,
            message: "User already exists",
            timestamp: new Date(),
          };
        case "BAD_REQUEST":
          return {
            success: false,
            message: "Invalid email",
            timestamp: new Date(),
          };
        default:
          return {
            errros: {},
            success: false,
            message: "Something went wrong",
            timestamp: new Date(),
          };
      }
    }
    throw error;
  }
}

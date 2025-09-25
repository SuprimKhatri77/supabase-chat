"use server";

import { auth } from "@/lib/auth/auth";
import { APIError } from "better-auth";
import z from "zod";

export type SignInFormState = {
  errors?: {
    properties?: {
      email?: string[];
      password?: string[];
    };
  };
  message: string;
  success: boolean;
  timestamp: Date;
  redirectTo?: string;
  inputs?: {
    email?: string;
    password?: string;
  };
};

export async function signIn(prevState: SignInFormState, formData: FormData) {
  const signInSchema = z.object({
    email: z.email(),
    password: z
      .string()
      .min(1, { error: "Password is required" })
      .nonempty({ error: "Password is required." }),
  });

  const validateFields = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validateFields.success) {
    const tree = z.treeifyError(validateFields.error);
    const data = Object.fromEntries(formData.entries());
    return {
      errors: {
        properties: {
          email: tree.properties?.email?.errors ?? [],
          password: tree.properties?.password?.errors ?? [],
        },
      },
      message: "Validation failed",
      success: false,
      timestamp: new Date(),
      inputs: data,
    };
  }
  const { email, password } = validateFields.data;

  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
        rememberMe: true,
      },
    });

    return {
      errors: {},
      message: "Logged in successfully!",
      success: true,
      timestamp: new Date(),
      redirectTo: "/chat",
    };
  } catch (error) {
    console.error("Error: ", error);
    if (error instanceof APIError) {
      switch (error.status) {
        case "UNPROCESSABLE_ENTITY":
          return {
            success: false,
            message: "Incorrect password",
            errors: {
              password: ["Incorrect password"],
            },
            timestamp: new Date(),
            inputs: {
              email,
              password,
            },
          };
        case "BAD_REQUEST":
          return {
            success: false,
            message: "Invalid email or password",
            errors: {
              email: ["Invalid email or password"],
            },
            timestamp: new Date(),
            inputs: {
              email,
              password,
            },
          };
        default:
          return {
            errors: {},
            success: false,
            message: error.body?.message ?? "Something went wrong",
            timestamp: new Date(),
            inputs: {
              email,
              password,
            },
          };
      }
    }
    return {
      errors: {},
      message: "An unexpected error occurred",
      success: false,
      timestamp: new Date(),
      redirectTo: "",
      inputs: {
        email,
        password,
      },
    };
  }
}

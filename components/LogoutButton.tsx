"use client";

import { authClient } from "@/lib/auth/auth-client";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Loader from "./Loader";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState<boolean>(false);
  const handleLogout = async () => {
    // console.log("Clicked on logout btn");
    setPending(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          baseURL:
            process.env.NODE_ENV === "production"
              ? `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/api/auth`
              : "http://localhost:3000/api/auth",
          onSuccess: () => {
            router.push("/login");
          },
        },
      });
    } catch (error) {
      console.log("Error: ", error);
    }
    setPending(false);
  };
  return (
    <Button onClick={handleLogout} disabled={pending}>
      {pending ? <Loader /> : "Logout"}
    </Button>
  );
}

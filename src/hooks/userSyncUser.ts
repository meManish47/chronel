import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";

export default function useSyncUser() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/users/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clerkId: user.id,
        name: user.firstName,
        email: user.primaryEmailAddress?.emailAddress,
      }),
    });
  }, [isLoaded, user]);
}
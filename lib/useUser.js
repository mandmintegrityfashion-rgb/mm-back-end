import { useEffect, useState } from "react";

export function useUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data?.user || null));
  }, []);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    setUser(null);
  }

  return { user, logout };
}

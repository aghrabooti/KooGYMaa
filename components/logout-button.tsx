"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <button className="dashboard-nav__item dashboard-nav__logout" disabled={isLoading} onClick={handleLogout} type="button">
      <Icon name="logout" size={19} />
      <span>{isLoading ? "Signing out…" : "Sign out"}</span>
    </button>
  );
}

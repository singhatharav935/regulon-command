"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem("tradeky_token");
    router.replace("/login");
  }, [router]);

  return null;
}

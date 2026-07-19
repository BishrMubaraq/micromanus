import { redirect } from "next/navigation";

import { getSession } from "@/features/auth/get-session";
import { ROUTES } from "@/lib/constants";

export default async function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect(ROUTES.home);
  }

  return children;
}

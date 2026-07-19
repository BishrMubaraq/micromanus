import { redirect } from "next/navigation";

import { signOut } from "@/features/auth/actions";
import { getSession } from "@/features/auth/get-session";
import { PaymentsPage } from "@/features/billing/components/payments-page";
import { ROUTES } from "@/lib/constants";
import { isLemonConfigured } from "@/lib/billing";
import { createClient } from "@/services/supabase/server";

type PaywallPageProps = {
  searchParams: Promise<{ checkout?: string }>;
};

export default async function PaywallPage({ searchParams }: PaywallPageProps) {
  const session = await getSession();
  if (!session) {
    redirect(ROUTES.home);
  }

  const params = await searchParams;
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("payments")
    .select(
      "id, amount_cents, currency, credits_granted, status, created_at, provider",
    )
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <PaymentsPage
      email={session.user.email}
      creditsBalance={session.profile?.credits_balance ?? 0}
      lemonConfigured={isLemonConfigured()}
      checkoutSuccess={params.checkout === "success"}
      payments={payments ?? []}
      onSignOut={signOut}
    />
  );
}

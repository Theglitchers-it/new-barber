import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ReferralPage } from "@/components/client/referral-page"

export default async function ReferralRoute() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return <ReferralPage userId={session.user.id} userName={session.user.name || "Cliente"} />
}

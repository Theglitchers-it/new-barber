import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { WalkInAdminPage } from "@/components/client/walkin-admin-page"
import { WalkInClientPage } from "@/components/client/walkin-client-page"
import { USER_ROLE } from "@/lib/constants"

export default async function WalkInPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  if (session.user.role === USER_ROLE.ADMIN) {
    return <WalkInAdminPage />
  }

  return <WalkInClientPage userId={session.user.id} />
}

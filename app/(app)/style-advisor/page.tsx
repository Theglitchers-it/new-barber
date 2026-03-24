import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { StyleAdvisorPage } from "@/components/client/style-advisor-page"

export default async function StyleAdvisorRoute() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return <StyleAdvisorPage />
}

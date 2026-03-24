import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SocialFeedPage } from "@/components/client/social-feed-page"

export default async function FeedPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return <SocialFeedPage />
}

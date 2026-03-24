"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { FeedPostCard } from "./feed-post-card"
import { Loader2, Sparkles } from "lucide-react"

interface FeedPost {
  id: string
  image: string
  beforeImage: string | null
  caption: string | null
  tags: string | null
  likesCount: number
  savesCount: number
  createdAt: string
  operator: { id: string; name: string; image: string | null; role: string }
  service: { id: string; name: string } | null
  _count: { comments: number }
  liked: boolean
  saved: boolean
}

export function SocialFeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const observerRef = useRef<HTMLDivElement>(null)

  const fetchPosts = useCallback(async (cursor?: string) => {
    const isInitial = !cursor
    if (isInitial) setLoading(true)
    else setLoadingMore(true)

    try {
      const params = new URLSearchParams({ limit: "10" })
      if (cursor) params.set("cursor", cursor)
      if (filter !== "all") params.set("tag", filter)

      const res = await fetch(`/api/feed?${params}`)
      if (!res.ok) return
      const data = await res.json()

      if (isInitial) {
        setPosts(data.posts)
      } else {
        setPosts(prev => [...prev, ...data.posts])
      }
      setHasMore(!!data.nextCursor)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filter])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Infinite scroll
  useEffect(() => {
    if (!observerRef.current || !hasMore) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loadingMore && posts.length > 0) {
          fetchPosts(posts[posts.length - 1].id)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, posts, fetchPosts])

  const handleLikeToggle = (postId: string, liked: boolean, likesCount: number) => {
    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, liked, likesCount } : p))
    )
  }

  const handleSaveToggle = (postId: string, saved: boolean, savesCount: number) => {
    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, saved, savesCount } : p))
    )
  }

  const filters = ["all", "taglio", "colore", "barba", "styling", "uomo", "donna"]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-heading font-bold">Ispirazione</h1>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filter === f
                ? "gradient-primary text-white shadow-lg shadow-primary/25"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {f === "all" ? "Tutti" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nessun post ancora</p>
          <p className="text-sm">I nostri stilisti posteranno presto i loro lavori!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <FeedPostCard
              key={post.id}
              post={post}
              onLikeToggle={handleLikeToggle}
              onSaveToggle={handleSaveToggle}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll trigger */}
      <div ref={observerRef} className="h-10 flex items-center justify-center">
        {loadingMore && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
      </div>
    </div>
  )
}

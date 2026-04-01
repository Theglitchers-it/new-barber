"use client"

import { useState } from "react"
import Image from "next/image"
import { Heart, Bookmark, MessageCircle, Calendar, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

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

interface FeedPostCardProps {
  post: FeedPost
  onLikeToggle: (postId: string, liked: boolean, likesCount: number) => void
  onSaveToggle: (postId: string, saved: boolean, savesCount: number) => void
}

export function FeedPostCard({ post, onLikeToggle, onSaveToggle }: FeedPostCardProps) {
  const [showBefore, setShowBefore] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Array<{ id: string; text: string; user: { name: string | null; avatar: string | null }; createdAt: string }>>([])
  const [commentText, setCommentText] = useState("")
  const [likeAnimating, setLikeAnimating] = useState(false)

  const handleLike = async () => {
    setLikeAnimating(true)
    setTimeout(() => setLikeAnimating(false), 600)

    const res = await fetch(`/api/feed/${post.id}/like`, { method: "POST" })
    if (res.ok) {
      const data = await res.json()
      onLikeToggle(post.id, data.liked, data.likesCount)
    }
  }

  const handleSave = async () => {
    const res = await fetch(`/api/feed/${post.id}/save`, { method: "POST" })
    if (res.ok) {
      const data = await res.json()
      onSaveToggle(post.id, data.saved, data.savesCount)
    }
  }

  const handleDoubleTapLike = async () => {
    if (!post.liked) {
      await handleLike()
    } else {
      setLikeAnimating(true)
      setTimeout(() => setLikeAnimating(false), 600)
    }
  }

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      const res = await fetch(`/api/feed/${post.id}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments)
      }
    }
    setShowComments(!showComments)
  }

  const submitComment = async () => {
    if (!commentText.trim()) return
    const res = await fetch(`/api/feed/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: commentText.trim() }),
    })
    if (res.ok) {
      const data = await res.json()
      setComments(prev => [...prev, data.comment])
      setCommentText("")
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Look di ${post.operator.name}`,
        text: post.caption || "Guarda questo look!",
        url: window.location.origin + `/feed?post=${post.id}`,
      })
    }
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    return `${days}g`
  }

  const operatorInitial = post.operator.name[0]?.toUpperCase() || "?"

  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 p-3">
        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
          {post.operator.image ? (
            <Image src={post.operator.image} alt="" width={36} height={36} className="rounded-full object-cover" />
          ) : (
            operatorInitial
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{post.operator.name}</p>
          <p className="text-[10px] text-muted-foreground">{post.operator.role} · {timeAgo(post.createdAt)}</p>
        </div>
        {post.service && (
          <Link
            href={`/prenotazioni?service=${post.service.id}`}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold hover:bg-primary/20 transition-colors"
          >
            <Calendar className="w-3 h-3" />
            Prenota
          </Link>
        )}
      </div>

      {/* Image */}
      <div
        className="relative aspect-[4/5] cursor-pointer select-none"
        onDoubleClick={handleDoubleTapLike}
      >
        <Image
          src={showBefore && post.beforeImage ? post.beforeImage : post.image}
          alt={post.caption || "Post"}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 500px"
        />

        {/* Like animation overlay */}
        {likeAnimating && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="w-20 h-20 text-red-500 fill-red-500 animate-ping" />
          </div>
        )}

        {/* Before/After toggle */}
        {post.beforeImage && (
          <button
            onClick={() => setShowBefore(!showBefore)}
            className="absolute top-3 right-3 px-2.5 py-1 rounded-full glass text-[10px] font-bold text-white"
          >
            {showBefore ? "DOPO ✨" : "PRIMA"}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 group"
            >
              <Heart
                className={cn(
                  "w-5 h-5 transition-all duration-200",
                  post.liked
                    ? "text-red-500 fill-red-500 scale-110"
                    : "text-muted-foreground group-hover:text-red-400"
                )}
              />
              <span className="text-xs font-medium">{post.likesCount}</span>
            </button>

            <button
              onClick={toggleComments}
              className="flex items-center gap-1.5 group"
            >
              <MessageCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium">{post._count.comments}</span>
            </button>

            <button onClick={handleShare} className="group">
              <Share2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </div>

          <button onClick={handleSave} className="group">
            <Bookmark
              className={cn(
                "w-5 h-5 transition-all duration-200",
                post.saved
                  ? "text-primary fill-primary"
                  : "text-muted-foreground group-hover:text-primary"
              )}
            />
          </button>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm">
            <span className="font-semibold">{post.operator.name}</span>{" "}
            {post.caption}
          </p>
        )}

        {/* Tags */}
        {post.tags && (
          <div className="flex flex-wrap gap-1">
            {post.tags.split(",").map(tag => (
              <span key={tag} className="text-[10px] text-primary font-medium">
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Comments section */}
        {showComments && (
          <div className="pt-2 border-t border-border/50 space-y-2">
            {comments.map(c => (
              <div key={c.id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">
                  {c.user.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-xs">
                    <span className="font-semibold">{c.user.name}</span>{" "}
                    {c.text}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{timeAgo(c.createdAt)}</p>
                </div>
              </div>
            ))}

            {/* Add comment */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitComment()}
                placeholder="Aggiungi un commento..."
                className="flex-1 text-xs bg-muted rounded-full px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary/50"
              />
              {commentText.trim() && (
                <button
                  onClick={submitComment}
                  className="text-xs font-semibold text-primary"
                >
                  Pubblica
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

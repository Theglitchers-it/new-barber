import "@/app/globals.css"

export const metadata = { title: "Prenota — SalonPro" }

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}

import { describe, it, expect } from "vitest"
import { navItems, filterNavItems } from "@/lib/nav"

describe("Navigation", () => {
  describe("navItems", () => {
    it("has dashboard as first item", () => {
      expect(navItems[0].href).toBe("/dashboard")
      expect(navItems[0].label).toBe("Dashboard")
    })

    it("all items have href, icon, and label", () => {
      for (const item of navItems) {
        expect(item.href).toBeTruthy()
        expect(item.href.startsWith("/")).toBe(true)
        expect(item.icon).toBeDefined()
        expect(item.label).toBeTruthy()
      }
    })

    it("has no duplicate hrefs", () => {
      const hrefs = navItems.map((i) => i.href)
      expect(new Set(hrefs).size).toBe(hrefs.length)
    })
  })

  describe("filterNavItems", () => {
    it("admin sees adminOnly items", () => {
      const filtered = filterNavItems(navItems, true)
      const hasTeam = filtered.some((i) => i.href === "/operatori")
      const hasClienti = filtered.some((i) => i.href === "/clienti")
      expect(hasTeam).toBe(true)
      expect(hasClienti).toBe(true)
    })

    it("admin does NOT see clientOnly items", () => {
      const filtered = filterNavItems(navItems, true)
      const hasProfilo = filtered.some((i) => i.href === "/profilo")
      const hasTimeline = filtered.some((i) => i.href === "/timeline")
      expect(hasProfilo).toBe(false)
      expect(hasTimeline).toBe(false)
    })

    it("client sees clientOnly items", () => {
      const filtered = filterNavItems(navItems, false)
      const hasProfilo = filtered.some((i) => i.href === "/profilo")
      const hasTimeline = filtered.some((i) => i.href === "/timeline")
      const hasCalendario = filtered.some((i) => i.href === "/calendario")
      expect(hasProfilo).toBe(true)
      expect(hasTimeline).toBe(true)
      expect(hasCalendario).toBe(true)
    })

    it("client does NOT see adminOnly items", () => {
      const filtered = filterNavItems(navItems, false)
      const hasTeam = filtered.some((i) => i.href === "/operatori")
      const hasClienti = filtered.some((i) => i.href === "/clienti")
      const hasRecensioni = filtered.some((i) => i.href === "/recensioni")
      expect(hasTeam).toBe(false)
      expect(hasClienti).toBe(false)
      expect(hasRecensioni).toBe(false)
    })

    it("both see shared items (dashboard, prenotazioni, shop, ordini, fedelta)", () => {
      const adminFiltered = filterNavItems(navItems, true)
      const clientFiltered = filterNavItems(navItems, false)

      const sharedHrefs = ["/dashboard", "/prenotazioni", "/shop", "/ordini", "/fedelta"]
      for (const href of sharedHrefs) {
        expect(adminFiltered.some((i) => i.href === href)).toBe(true)
        expect(clientFiltered.some((i) => i.href === href)).toBe(true)
      }
    })
  })
})

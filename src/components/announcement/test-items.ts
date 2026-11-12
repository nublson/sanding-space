import type { AnnouncementItem } from "@/lib/content/announcement";

/** Shared fixtures for the card and bar tests. */
export const essay: AnnouncementItem = {
  kind: "essay",
  id: "layout",
  title: "Layout",
  summary: "Why a box that jumps feels broken.",
  href: "/layout",
  label: "New essay",
  icon: null,
  startsAt: null,
  expiresAt: "2026-11-15T00:00:00.000Z",
};

export const promo: AnnouncementItem = {
  kind: "external",
  id: "p1",
  title: "Interfaces",
  summary: "A magazine.",
  href: "https://interfaces.example",
  label: null,
  icon: "data:image/png;base64,AA==",
  startsAt: null,
  expiresAt: null,
};

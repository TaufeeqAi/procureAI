import type { Actor } from "@/types/common";

export const currentUser: Actor = {
  id: "user-demo-buyer",
  name: "Procurement User",
  role: "BUYER",
};

export * from "@/lib/mock/queries";

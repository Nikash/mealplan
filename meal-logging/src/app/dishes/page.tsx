import { Suspense } from "react";
import { DishList } from "@/components/DishList";

export default function DishesPage() {
  return (
    <Suspense fallback={<p className="muted">Loading…</p>}>
      <DishList />
    </Suspense>
  );
}

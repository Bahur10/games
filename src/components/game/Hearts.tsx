import { Heart, HeartCrack } from "lucide-react";
import { STARTING_LIVES } from "@/lib/config";
import { cn } from "@/lib/utils";

/** Row of hearts showing the lives the student has left. */
export default function Hearts({ lives, size = "md" }: { lives: number; size?: "sm" | "md" }) {
  const iconClass = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  return (
    <div className="flex items-center gap-1" aria-label={`${lives} of ${STARTING_LIVES} lives left`}>
      {Array.from({ length: STARTING_LIVES }, (_, i) =>
        i < lives ? (
          <Heart key={i} className={cn(iconClass, "fill-rose-500 text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]")} />
        ) : (
          <HeartCrack key={i} className={cn(iconClass, "animate-heart-lost text-slate-600")} />
        ),
      )}
    </div>
  );
}

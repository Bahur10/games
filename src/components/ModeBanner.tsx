import { FlaskConical } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * Shown only in demo mode (no Supabase env vars) so testers know the data
 * is stored locally. Login credentials are intentionally never displayed.
 */
export default function ModeBanner() {
  if (isSupabaseConfigured) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
      <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
      <div>
        <p className="font-semibold">Demo mode — no database connected</p>
        <p className="mt-1 text-amber-200/80">
          Questions and scores are stored in this browser (localStorage). To go live with
          Supabase, run <code className="rounded bg-black/30 px-1">supabase/schema.sql</code>{" "}
          and set the keys from <code className="rounded bg-black/30 px-1">.env.example</code>.
        </p>
      </div>
    </div>
  );
}

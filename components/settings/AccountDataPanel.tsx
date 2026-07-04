"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch, useCsrfToken } from "@/components/providers/CsrfProvider";

export function AccountDataPanel() {
  const csrfToken = useCsrfToken();
  const [status, setStatus] = useState<string>("");

  async function exportData() {
    setStatus("Exporting...");
    const response = await apiFetch("/api/account/export", { method: "POST" }, csrfToken);
    const data = await response.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "rapidread-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("Export ready.");
  }

  async function deleteData() {
    if (!window.confirm("Delete all profile, interactions, and recommendation data?")) return;
    setStatus("Deleting...");
    await apiFetch("/api/account/delete", { method: "POST" }, csrfToken);
    setStatus("Your data was deleted.");
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="font-serif text-xl font-semibold">Your data</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Export a JSON copy of your profile and interactions, or permanently delete your account data.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="outline" onClick={exportData}>
          Export data
        </Button>
        <Button variant="destructive" onClick={deleteData}>
          Delete account data
        </Button>
      </div>
      {status ? <p className="mt-3 text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ToolbarBuilder } from "@/components/toolbar-builder/toolbar-builder";
import { Button } from "@/components/ui/button";
import { useCreateProfile } from "@/hooks";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { EditorProfileConfig } from "@/types";

export default function NewProfilePage() {
  const router = useRouter();
  const { createProfile, isLoading } = useCreateProfile();
  const [profileName, setProfileName] = useState("");
  const [config, setConfig] = useState<EditorProfileConfig>({
    toolbar: { items: [] },
  });

  const handleSave = async () => {
    if (!profileName.trim()) {
      toast.error("Please enter a profile name");
      return;
    }

    if (config.toolbar.items.length === 0) {
      toast.error("Please add at least one toolbar item");
      return;
    }

    const result = await createProfile({
      name: profileName,
      value: JSON.stringify(config),
    });

    if (result) {
      toast.success("Profile created successfully");
      router.push(`/profiles/${result.id}`);
    } else {
      toast.error("Failed to create profile");
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/profiles">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">New Profile</h1>
              <p className="text-muted-foreground">
                Create a new editor toolbar configuration
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Profile
          </Button>
        </div>

        <ToolbarBuilder
          profileName={profileName}
          onProfileNameChange={setProfileName}
          onConfigChange={setConfig}
        />
      </div>
    </AppShell>
  );
}

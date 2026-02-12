"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ToolbarBuilder } from "@/components/toolbar-builder/toolbar-builder";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile, useUpdateProfile } from "@/hooks";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { parseProfileValue, getProfileValue, type EditorProfileConfig } from "@/types";

interface EditProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function EditProfilePage({ params }: EditProfilePageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { profile, isLoading: profileLoading } = useProfile(id);
  const { updateProfile, isLoading: updateLoading } = useUpdateProfile();
  const [profileName, setProfileName] = useState("");
  const [config, setConfig] = useState<EditorProfileConfig | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (profile && !initialized) {
      setProfileName(profile.name);
      const profileValue = getProfileValue(profile);
      const parsedConfig = parseProfileValue(profileValue);
      setConfig(parsedConfig || { toolbar: { items: [] } });
      setInitialized(true);
    }
  }, [profile, initialized]);

  const handleSave = async () => {
    if (!profileName.trim()) {
      toast.error("Please enter a profile name");
      return;
    }

    if (!config || config.toolbar.items.length === 0) {
      toast.error("Please add at least one toolbar item");
      return;
    }

    const result = await updateProfile(id, {
      name: profileName,
      profile: JSON.stringify(config),
    });

    if (result) {
      toast.success("Profile updated successfully");
      router.push(`/profiles/${id}`);
    } else {
      toast.error("Failed to update profile");
    }
  };

  if (profileLoading || !initialized) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Profile not found.</p>
          <Link href="/profiles">
            <Button>Back to Profiles</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/profiles/${id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
              <p className="text-muted-foreground">
                Modify toolbar configuration for {profile.name}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={updateLoading} className="gap-2">
            {updateLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>

        {config && (
          <ToolbarBuilder
            profileName={profileName}
            onProfileNameChange={setProfileName}
            initialConfig={config}
            onConfigChange={setConfig}
          />
        )}
      </div>
    </AppShell>
  );
}

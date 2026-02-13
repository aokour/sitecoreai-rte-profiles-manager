"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ToolbarBuilder } from "@/components/toolbar-builder/toolbar-builder";
import { ToolbarPreview } from "@/components/profiles/toolbar-preview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCreateProfile } from "@/hooks";
import { ArrowLeft, Save, Loader2, Check, FileText, Wand2 } from "lucide-react";
import { toast } from "sonner";
import {
  PROFILE_TEMPLATES,
  type ProfileTemplate,
} from "@/lib/profile-templates";
import type { EditorProfileConfig } from "@/types";
import { cn } from "@/lib/utils";

export default function NewProfilePage() {
  const router = useRouter();
  const { createProfile, isLoading } = useCreateProfile();
  const [step, setStep] = useState<"template" | "builder">("template");
  const [selectedTemplate, setSelectedTemplate] =
    useState<ProfileTemplate | null>(null);
  const [profileName, setProfileName] = useState("");
  const [config, setConfig] = useState<EditorProfileConfig>({
    toolbar: { items: [] },
  });

  const handleSelectTemplate = useCallback((template: ProfileTemplate) => {
    setSelectedTemplate(template);
  }, []);

  const handleContinue = useCallback(() => {
    if (selectedTemplate) {
      // Deep clone the config to avoid mutations
      setConfig(JSON.parse(JSON.stringify(selectedTemplate.config)));
      setStep("builder");
    }
  }, [selectedTemplate]);

  const handleBackToTemplates = useCallback(() => {
    setStep("template");
  }, []);

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

  // Template selection step
  if (step === "template") {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">New Profile</h1>
              <p className="text-muted-foreground">
                Choose a template to start with, then customize the toolbar
                items to your needs.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {PROFILE_TEMPLATES.map((template) => (
              <Card
                key={template.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  selectedTemplate?.id === template.id
                    ? "ring-2 ring-primary border-primary"
                    : "hover:border-muted-foreground/50",
                )}
                onClick={() => handleSelectTemplate(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {template.id === "blank" ? (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Wand2 className="h-5 w-5 text-primary" />
                      )}
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    {selectedTemplate?.id === template.id && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {template.id === "blank" ? (
                    <div className="h-12 flex items-center justify-center text-sm text-muted-foreground border rounded-lg bg-muted/30">
                      Empty toolbar
                    </div>
                  ) : (
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <ToolbarPreview value={JSON.stringify(template.config)} />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleContinue}
              disabled={!selectedTemplate}
              className="gap-2"
            >
              Continue
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  // Builder step
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBackToTemplates}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">New Profile</h1>
              <p className="text-muted-foreground">
                {selectedTemplate?.id === "blank"
                  ? "Create a new editor toolbar configuration"
                  : `Starting from "${selectedTemplate?.name}" template`}
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
          initialConfig={config}
          onConfigChange={setConfig}
        />
      </div>
    </AppShell>
  );
}

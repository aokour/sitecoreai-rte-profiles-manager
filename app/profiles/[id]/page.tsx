"use client";

import { use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ToolbarPreview } from "@/components/profiles/toolbar-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks";
import { ArrowLeft, Pencil, Code, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { parseProfileValue, getProfileValue } from "@/types";

interface ProfileDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProfileDetailPage({ params }: ProfileDetailPageProps) {
  const { id } = use(params);
  const { profile, isLoading } = useProfile(id);

  const profileValue = profile ? getProfileValue(profile) : "";
  const config = profile ? parseProfileValue(profileValue) : null;

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Profile not found.</p>
          <Link href="/">
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
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{profile.name}</h1>
              <p className="text-muted-foreground">
                Profile ID: {profile.id}
              </p>
            </div>
          </div>
          <Link href={`/profiles/${id}/edit`}>
            <Button className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit Profile
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Toolbar Configuration</CardTitle>
                <CardDescription>Visual preview of the editor toolbar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-lg bg-muted/30">
                  <ToolbarPreview value={profileValue} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  <CardTitle>JSON Configuration</CardTitle>
                </div>
                <CardDescription>Raw configuration data</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-muted rounded-lg overflow-auto text-sm max-h-96">
                  {config ? JSON.stringify(config, null, 2) : profileValue}
                </pre>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Profile Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Advanced configuration options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Content Wrapper Setting */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Content Wrapper</p>
                      <p className="text-xs text-muted-foreground">
                        <code className="px-1 py-0.5 bg-muted rounded">ck-content</code> wrapper around RTE output
                      </p>
                    </div>
                    {config?.disableContentWrap ? (
                      <Badge colorScheme="warning" size="sm" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Disabled
                      </Badge>
                    ) : (
                      <Badge colorScheme="success" size="sm" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Enabled
                      </Badge>
                    )}
                  </div>
                  {config?.disableContentWrap && (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-700 dark:text-amber-400">
                      <p>This profile disables the automatic content wrapper. Ensure your site provides equivalent CSS styling.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {config?.style && config.style.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Custom Styles</CardTitle>
                  <CardDescription>Defined style classes for the Styles dropdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {config.style.map((styleDef, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-muted/30">
                        <div className="font-medium text-sm">{styleDef.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          &lt;{styleDef.element}&gt; with classes: {styleDef.classes.map(c => `.${c}`).join(" ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ToolbarPreview } from "@/components/profiles/toolbar-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProfiles, useDeleteProfile } from "@/hooks";
import {
  useMarketplaceClient,
  useAppContext,
} from "@/components/providers/marketplace";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getProfileValue,
  siteHasProfile,
  parseProfileValue,
  type Site,
} from "@/types";
import { Badge } from "@/components/ui/badge";

export default function ProfilesPage() {
  const { profiles, isLoading, refetch } = useProfiles();
  const { deleteProfile, isLoading: isDeleting } = useDeleteProfile();
  const client = useMarketplaceClient();
  const appContext = useAppContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [assignedSiteCount, setAssignedSiteCount] = useState<number | null>(
    null,
  );
  const [isCheckingSites, setIsCheckingSites] = useState(false);

  const sitecoreContextId = appContext.resourceAccess?.[0]?.context?.preview;

  const filteredProfiles = profiles.filter((profile) =>
    profile.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Check if profile has sites assigned
  const checkProfileSites = useCallback(
    async (profileId: string): Promise<number> => {
      if (!sitecoreContextId || !client) {
        return 0;
      }

      try {
        const response = await client.query("xmc.sites.listSites", {
          params: {
            query: { sitecoreContextId },
          },
        });

        // Handle SDK response structure
        let sitesData: Site[] = [];
        const resp = response as unknown as { data?: { data?: unknown } };

        if (resp?.data?.data && Array.isArray(resp.data.data)) {
          sitesData = resp.data.data as Site[];
        } else if (resp?.data && Array.isArray(resp.data)) {
          sitesData = resp.data as Site[];
        } else if (Array.isArray(resp)) {
          sitesData = resp as Site[];
        }

        // Count sites with this profile
        return sitesData.filter((site) => siteHasProfile(site, profileId))
          .length;
      } catch (error) {
        console.error("Error checking sites:", error);
        return 0;
      }
    },
    [client, sitecoreContextId],
  );

  // User clicks delete - check for sites and open dialog
  const handleDeleteClick = async (profileId: string) => {
    setPendingDeleteId(profileId);
    setAssignedSiteCount(null);
    setDeleteDialogOpen(true);
    setIsCheckingSites(true);

    try {
      const count = await checkProfileSites(profileId);
      setAssignedSiteCount(count);
    } catch (error) {
      console.error("Error:", error);
      setAssignedSiteCount(0);
    } finally {
      setIsCheckingSites(false);
    }
  };

  // User confirms delete
  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;

    const success = await deleteProfile(pendingDeleteId);
    if (success) {
      toast.success("Profile deleted successfully");
      refetch();
    } else {
      toast.error("Failed to delete profile");
    }
    handleCloseDialog();
  };

  const handleCloseDialog = () => {
    setDeleteDialogOpen(false);
    setPendingDeleteId(null);
    setAssignedSiteCount(null);
  };

  const pendingProfile = pendingDeleteId
    ? profiles.find((p) => p.id === pendingDeleteId)
    : null;

  const hasSitesAssigned = assignedSiteCount !== null && assignedSiteCount > 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profiles</h1>
            <p className="text-muted-foreground">
              Manage your editor toolbar configurations
            </p>
          </div>
          <Link href="/profiles/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Profile
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search profiles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-48 mb-3" />
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "No profiles match your search."
                : "No profiles found."}
            </p>
            {!searchQuery && (
              <Link href="/profiles/new">
                <Button>Create your first profile</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProfiles.map((profile) => {
              const profileValue = getProfileValue(profile);
              const config = parseProfileValue(profileValue);
              return (
                <Card
                  key={profile.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/profiles/${profile.id}`}
                          className="text-lg font-semibold hover:underline"
                        >
                          {profile.name}
                        </Link>
                        {config?.disableContentWrap ? (
                          <Badge colorScheme="blue" size="sm" className="gap-1">
                            ck-content wrapper disabled
                          </Badge>
                        ) : (
                          <Badge
                            colorScheme="success"
                            size="sm"
                            className="gap-1"
                          >
                            ck-content wrapper enabled
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Link href={`/profiles/${profile.id}/edit`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(profile.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg bg-muted/30">
                      <ToolbarPreview value={profileValue} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {hasSitesAssigned ? (
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Cannot Delete Profile
                </span>
              ) : (
                "Delete Profile"
              )}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {isCheckingSites ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Checking if profile is in use...</span>
                  </div>
                ) : hasSitesAssigned ? (
                  <div className="space-y-3">
                    <p>
                      The profile{" "}
                      <strong>&quot;{pendingProfile?.name}&quot;</strong> is
                      currently assigned to{" "}
                      <strong>
                        {assignedSiteCount} site
                        {assignedSiteCount !== 1 ? "s" : ""}
                      </strong>
                      .
                    </p>
                    <p>
                      To delete this profile, first reassign or remove it from
                      all sites in the Sites page.
                    </p>
                  </div>
                ) : (
                  <p>
                    Are you sure you want to delete{" "}
                    <strong>&quot;{pendingProfile?.name}&quot;</strong>? This
                    action cannot be undone.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {hasSitesAssigned ? "Close" : "Cancel"}
            </AlertDialogCancel>
            {hasSitesAssigned ? (
              <Link href="/sites">
                <AlertDialogAction>Go to Sites</AlertDialogAction>
              </Link>
            ) : (
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={isCheckingSites || isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

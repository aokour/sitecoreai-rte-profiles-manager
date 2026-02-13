"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProfileAssignment } from "@/components/sites/profile-assignment";
import { useSites, useProfiles, useUpdateSite } from "@/hooks";
import { getSiteEditorProfiles } from "@/types";
import { Search } from "lucide-react";
import { toast } from "sonner";

export default function SitesPage() {
  const { sites, isLoading: sitesLoading, refetch: refetchSites } = useSites();
  const { profiles, isLoading: profilesLoading } = useProfiles();
  const { updateSite, isLoading: updateLoading } = useUpdateSite();
  
  const [searchQuery, setSearchQuery] = useState("");

  const isLoading = sitesLoading || profilesLoading;

  const filteredSites = sites.filter(
    (site) =>
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (site.displayName?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleProfilesUpdate = async (siteId: string, profileIds: string[]) => {
    const result = await updateSite(siteId, profileIds);
    if (result) {
      toast.success("Site profiles updated");
      refetchSites();
    } else {
      toast.error("Failed to update site profiles");
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sites</h1>
          <p className="text-muted-foreground">
            View and manage profile assignments for your sites
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search sites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : filteredSites.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? "No sites match your search." : "No sites found."}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site Name</TableHead>
                  <TableHead>Collection</TableHead>
                  <TableHead>Editor Profiles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {site.displayName || site.name}
                        </div>
                        {site.displayName && site.displayName !== site.name && (
                          <div className="text-xs text-muted-foreground">
                            {site.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {site.collectionName || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ProfileAssignment
                        siteId={site.id}
                        assignedProfileIds={getSiteEditorProfiles(site)}
                        allProfiles={profiles}
                        onUpdate={(profileIds) => handleProfilesUpdate(site.id, profileIds)}
                        disabled={updateLoading}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

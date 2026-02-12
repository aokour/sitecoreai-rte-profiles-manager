"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSites, useProfiles, useUpdateSite, useBulkUpdateSites } from "@/hooks";
import { getSiteEditorProfileId } from "@/types";
import { Search, Settings2 } from "lucide-react";
import { toast } from "sonner";

export default function SitesPage() {
  const { sites, isLoading: sitesLoading, refetch: refetchSites } = useSites();
  const { profiles, isLoading: profilesLoading } = useProfiles();
  const { updateSite, isLoading: updateLoading } = useUpdateSite();
  const { bulkUpdateSites, isLoading: bulkLoading, progress } = useBulkUpdateSites();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [bulkProfileId, setBulkProfileId] = useState<string>("");

  const isLoading = sitesLoading || profilesLoading;

  const filteredSites = sites.filter(
    (site) =>
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (site.displayName?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getProfileName = (profileId: string | undefined) => {
    if (!profileId) return null;
    const profile = profiles.find((p) => p.id === profileId);
    return profile?.name || "Unknown";
  };

  const handleProfileChange = async (siteId: string, profileId: string | null) => {
    const result = await updateSite(siteId, profileId);
    if (result) {
      toast.success("Site profile updated");
      refetchSites();
    } else {
      toast.error("Failed to update site profile");
    }
  };

  const handleBulkAssign = async () => {
    if (selectedSites.length === 0) {
      toast.error("Please select at least one site");
      return;
    }

    const profileId = bulkProfileId === "none" ? null : bulkProfileId;
    const success = await bulkUpdateSites(selectedSites, profileId);
    
    if (success) {
      toast.success(`Updated ${selectedSites.length} sites`);
      setSelectedSites([]);
      setBulkProfileId("");
      refetchSites();
    } else {
      toast.error("Some sites failed to update");
    }
  };

  const toggleSelectAll = () => {
    if (selectedSites.length === filteredSites.length) {
      setSelectedSites([]);
    } else {
      setSelectedSites(filteredSites.map((s) => s.id));
    }
  };

  const toggleSelect = (siteId: string) => {
    setSelectedSites((prev) =>
      prev.includes(siteId)
        ? prev.filter((id) => id !== siteId)
        : [...prev, siteId]
    );
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

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search sites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {selectedSites.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge colorScheme="primary">{selectedSites.length} selected</Badge>
              <Select value={bulkProfileId} onValueChange={setBulkProfileId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No profile</SelectItem>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleBulkAssign}
                disabled={!bulkProfileId || bulkLoading}
                className="gap-2"
              >
                <Settings2 className="h-4 w-4" />
                {bulkLoading
                  ? `Updating ${progress.completed}/${progress.total}...`
                  : "Assign"}
              </Button>
            </div>
          )}
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
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedSites.length === filteredSites.length &&
                        filteredSites.length > 0
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Site Name</TableHead>
                  <TableHead>Collection</TableHead>
                  <TableHead>Editor Profile</TableHead>
                  <TableHead className="w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedSites.includes(site.id)}
                        onCheckedChange={() => toggleSelect(site.id)}
                      />
                    </TableCell>
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
                      {getSiteEditorProfileId(site) ? (
                        <Link href={`/profiles/${getSiteEditorProfileId(site)}`}>
                          <Badge colorScheme="primary" className="cursor-pointer">
                            {getProfileName(getSiteEditorProfileId(site))}
                          </Badge>
                        </Link>
                      ) : (
                        <Badge colorScheme="neutral">No profile</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={getSiteEditorProfileId(site) || "none"}
                        onValueChange={(value) =>
                          handleProfileChange(
                            site.id,
                            value === "none" ? null : value
                          )
                        }
                        disabled={updateLoading}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Assign profile" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No profile</SelectItem>
                          {profiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

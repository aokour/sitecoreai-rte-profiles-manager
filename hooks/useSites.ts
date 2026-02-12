"use client";

import { useCallback, useState, useEffect } from "react";
import { useMarketplaceClient, useAppContext } from "@/components/providers/marketplace";
import type { Site, SiteCollection } from "@/types";

interface UseSitesReturn {
  sites: Site[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseSiteReturn {
  site: Site | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseCollectionsReturn {
  collections: SiteCollection[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseUpdateSiteReturn {
  updateSite: (siteId: string, editorProfileId: string | null) => Promise<Site | null>;
  isLoading: boolean;
  error: string | null;
}

interface UseBulkUpdateSitesReturn {
  bulkUpdateSites: (siteIds: string[], editorProfileId: string | null) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  progress: { completed: number; total: number };
}

// Hook to get all sites
export function useSites(): UseSitesReturn {
  const client = useMarketplaceClient();
  const appContext = useAppContext();
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sitecoreContextId = appContext.resourceAccess?.[0]?.context?.preview;

  const fetchSites = useCallback(async () => {
    if (!sitecoreContextId) {
      setError("No Sitecore context available");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await client.query("xmc.sites.listSites", {
        params: {
          query: { sitecoreContextId },
        },
      });

      console.log("Sites API response:", response);
      
      // Handle SDK response structure: response.data.data contains the array
      let sitesData: Site[] = [];
      const resp = response as unknown as { data?: { data?: unknown } };
      
      if (resp?.data?.data && Array.isArray(resp.data.data)) {
        // Double nested: response.data.data
        sitesData = resp.data.data as Site[];
      } else if (resp?.data && Array.isArray(resp.data)) {
        // Single nested: response.data
        sitesData = resp.data as Site[];
      } else if (Array.isArray(resp)) {
        // Direct array
        sitesData = resp as Site[];
      }
      
      console.log("Parsed sites:", sitesData);
      setSites(sitesData);
    } catch (err) {
      console.error("Error fetching sites:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch sites");
    } finally {
      setIsLoading(false);
    }
  }, [client, sitecoreContextId]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  return {
    sites,
    isLoading,
    error,
    refetch: fetchSites,
  };
}

// Hook to get a single site
export function useSite(siteId: string | null): UseSiteReturn {
  const client = useMarketplaceClient();
  const appContext = useAppContext();
  const [site, setSite] = useState<Site | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sitecoreContextId = appContext.resourceAccess?.[0]?.context?.preview;

  const fetchSite = useCallback(async () => {
    if (!siteId) {
      setSite(null);
      setIsLoading(false);
      return;
    }

    if (!sitecoreContextId) {
      setError("No Sitecore context available");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await client.query("xmc.sites.retrieveSite", {
        params: {
          path: { siteId },
          query: { sitecoreContextId },
        },
      });

      if (response?.data) {
        setSite(response.data as unknown as Site);
      }
    } catch (err) {
      console.error("Error fetching site:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch site");
    } finally {
      setIsLoading(false);
    }
  }, [client, siteId, sitecoreContextId]);

  useEffect(() => {
    fetchSite();
  }, [fetchSite]);

  return {
    site,
    isLoading,
    error,
    refetch: fetchSite,
  };
}

// Hook to get all collections
export function useCollections(): UseCollectionsReturn {
  const client = useMarketplaceClient();
  const appContext = useAppContext();
  const [collections, setCollections] = useState<SiteCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sitecoreContextId = appContext.resourceAccess?.[0]?.context?.preview;

  const fetchCollections = useCallback(async () => {
    if (!sitecoreContextId) {
      setError("No Sitecore context available");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await client.query("xmc.sites.listCollections", {
        params: {
          query: { sitecoreContextId },
        },
      });

      if (response?.data) {
        const data = response.data as unknown;
        setCollections((Array.isArray(data) ? data : []) as SiteCollection[]);
      }
    } catch (err) {
      console.error("Error fetching collections:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch collections");
    } finally {
      setIsLoading(false);
    }
  }, [client, sitecoreContextId]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return {
    collections,
    isLoading,
    error,
    refetch: fetchCollections,
  };
}

// Hook to update a site's editor profile
export function useUpdateSite(): UseUpdateSiteReturn {
  const client = useMarketplaceClient();
  const appContext = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sitecoreContextId = appContext.resourceAccess?.[0]?.context?.preview;

  const updateSite = useCallback(
    async (siteId: string, editorProfileId: string | null): Promise<Site | null> => {
      if (!sitecoreContextId) {
        setError("No Sitecore context available");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        // editorProfiles is an array of profile IDs
        const editorProfiles = editorProfileId ? [editorProfileId] : [];
        const response = await client.mutate("xmc.sites.updateSite", {
          params: {
            path: { siteId },
            body: { editorProfiles },
            query: { sitecoreContextId },
          },
        });

        if (response?.data) {
          return response.data as unknown as Site;
        }
        return null;
      } catch (err) {
        console.error("Error updating site:", err);
        setError(err instanceof Error ? err.message : "Failed to update site");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [client, sitecoreContextId]
  );

  return {
    updateSite,
    isLoading,
    error,
  };
}

// Hook to bulk update sites' editor profiles
export function useBulkUpdateSites(): UseBulkUpdateSitesReturn {
  const client = useMarketplaceClient();
  const appContext = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  const sitecoreContextId = appContext.resourceAccess?.[0]?.context?.preview;

  const bulkUpdateSites = useCallback(
    async (siteIds: string[], editorProfileId: string | null): Promise<boolean> => {
      if (!sitecoreContextId) {
        setError("No Sitecore context available");
        return false;
      }

      if (siteIds.length === 0) {
        return true;
      }

      setIsLoading(true);
      setError(null);
      setProgress({ completed: 0, total: siteIds.length });

      try {
        let completed = 0;
        const errors: string[] = [];

        const editorProfiles = editorProfileId ? [editorProfileId] : [];
        for (const siteId of siteIds) {
          try {
            await client.mutate("xmc.sites.updateSite", {
              params: {
                path: { siteId },
                body: { editorProfiles },
                query: { sitecoreContextId },
              },
            });
            completed++;
            setProgress({ completed, total: siteIds.length });
          } catch (err) {
            errors.push(`Failed to update site ${siteId}`);
          }
        }

        if (errors.length > 0) {
          setError(`${errors.length} site(s) failed to update`);
          return false;
        }

        return true;
      } catch (err) {
        console.error("Error bulk updating sites:", err);
        setError(err instanceof Error ? err.message : "Failed to bulk update sites");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [client, sitecoreContextId]
  );

  return {
    bulkUpdateSites,
    isLoading,
    error,
    progress,
  };
}

// Hook to get sites with their profile information combined
export function useSitesWithProfiles() {
  const { sites, isLoading: sitesLoading, error: sitesError, refetch: refetchSites } = useSites();
  
  return {
    sites,
    isLoading: sitesLoading,
    error: sitesError,
    refetch: refetchSites,
  };
}

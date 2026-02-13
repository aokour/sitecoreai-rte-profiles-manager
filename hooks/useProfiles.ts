"use client";

import { useCallback, useState, useEffect } from "react";
import { useMarketplaceClient, useAppContext } from "@/components/providers/marketplace";
import type {
  EditorProfile,
  CreateEditorProfileInput,
  UpdateEditorProfileInput,
} from "@/types";

interface UseProfilesReturn {
  profiles: EditorProfile[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseProfileReturn {
  profile: EditorProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseCreateProfileReturn {
  createProfile: (input: CreateEditorProfileInput) => Promise<EditorProfile | null>;
  isLoading: boolean;
  error: string | null;
}

interface UseUpdateProfileReturn {
  updateProfile: (id: string, input: UpdateEditorProfileInput) => Promise<EditorProfile | null>;
  isLoading: boolean;
  error: string | null;
}

interface UseDeleteProfileReturn {
  deleteProfile: (id: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

// Hook to get all profiles
export function useProfiles(): UseProfilesReturn {
  const client = useMarketplaceClient();
  const appContext = useAppContext();
  const [profiles, setProfiles] = useState<EditorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sitecoreContextId = appContext.resourceAccess?.[0]?.context?.preview;

  const fetchProfiles = useCallback(async () => {
    if (!sitecoreContextId) {
      setError("No Sitecore context available");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await client.query("xmc.sites.listProfiles", {
        params: {
          query: { sitecoreContextId },
        },
      });

      console.log("Profiles API response:", response);
      
      // Handle SDK response structure: response.data.data contains the array
      let profilesData: EditorProfile[] = [];
      const resp = response as unknown as { data?: { data?: unknown } };
      
      if (resp?.data?.data && Array.isArray(resp.data.data)) {
        // Double nested: response.data.data
        profilesData = resp.data.data as EditorProfile[];
      } else if (resp?.data && Array.isArray(resp.data)) {
        // Single nested: response.data
        profilesData = resp.data as EditorProfile[];
      } else if (Array.isArray(resp)) {
        // Direct array
        profilesData = resp as EditorProfile[];
      }
      
      console.log("Parsed profiles:", profilesData);
      setProfiles(profilesData);
    } catch (err) {
      console.error("Error fetching profiles:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch profiles");
    } finally {
      setIsLoading(false);
    }
  }, [client, sitecoreContextId]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return {
    profiles,
    isLoading,
    error,
    refetch: fetchProfiles,
  };
}

// Hook to get a single profile
export function useProfile(profileId: string | null): UseProfileReturn {
  const client = useMarketplaceClient();
  const appContext = useAppContext();
  const [profile, setProfile] = useState<EditorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sitecoreContextId = appContext.resourceAccess?.[0]?.context?.preview;

  const fetchProfile = useCallback(async () => {
    if (!profileId) {
      setProfile(null);
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
      const response = await client.query("xmc.sites.getProfile", {
        params: {
          path: { id: profileId },
          query: { sitecoreContextId },
        },
      });

      console.log("Profile API response:", response);
      
      // Handle SDK response structure: response.data.data contains the profile
      let profileData: EditorProfile | null = null;
      const resp = response as unknown as { data?: { data?: unknown } };
      
      if (resp?.data?.data && typeof resp.data.data === 'object') {
        // Double nested: response.data.data
        profileData = resp.data.data as EditorProfile;
      } else if (resp?.data && typeof resp.data === 'object' && !Array.isArray(resp.data)) {
        // Single nested: response.data (check if it has id/name properties)
        const data = resp.data as Record<string, unknown>;
        if ('id' in data || 'name' in data) {
          profileData = data as unknown as EditorProfile;
        }
      }
      
      console.log("Parsed profile:", profileData);
      setProfile(profileData);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
    } finally {
      setIsLoading(false);
    }
  }, [client, profileId, sitecoreContextId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
  };
}

// Hook to create a profile
export function useCreateProfile(): UseCreateProfileReturn {
  const client = useMarketplaceClient();
  const appContext = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sitecoreContextId = appContext.resourceAccess?.[0]?.context?.preview;

  const createProfile = useCallback(
    async (input: CreateEditorProfileInput): Promise<EditorProfile | null> => {
      if (!sitecoreContextId) {
        setError("No Sitecore context available");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await client.mutate("xmc.sites.createProfile", {
          params: {
            body: input,
            query: { sitecoreContextId },
          },
        });

        if (response?.data) {
          return response.data as unknown as EditorProfile;
        }
        return null;
      } catch (err) {
        console.error("Error creating profile:", err);
        setError(err instanceof Error ? err.message : "Failed to create profile");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [client, sitecoreContextId]
  );

  return {
    createProfile,
    isLoading,
    error,
  };
}

// Hook to update a profile
export function useUpdateProfile(): UseUpdateProfileReturn {
  const client = useMarketplaceClient();
  const appContext = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sitecoreContextId = appContext.resourceAccess?.[0]?.context?.preview;

  const updateProfile = useCallback(
    async (id: string, input: UpdateEditorProfileInput): Promise<EditorProfile | null> => {
      if (!sitecoreContextId) {
        setError("No Sitecore context available");
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await client.mutate("xmc.sites.updateProfile", {
          params: {
            path: { id },
            body: input,
            query: { sitecoreContextId },
          },
        });

        if (response?.data) {
          return response.data as unknown as EditorProfile;
        }
        return null;
      } catch (err) {
        console.error("Error updating profile:", err);
        setError(err instanceof Error ? err.message : "Failed to update profile");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [client, sitecoreContextId]
  );

  return {
    updateProfile,
    isLoading,
    error,
  };
}

// Hook to delete a profile
export function useDeleteProfile(): UseDeleteProfileReturn {
  const client = useMarketplaceClient();
  const appContext = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sitecoreContextId = appContext.resourceAccess?.[0]?.context?.preview;

  const deleteProfile = useCallback(
    async (id: string): Promise<boolean> => {
      if (!sitecoreContextId) {
        setError("No Sitecore context available");
        return false;
      }

      setIsLoading(true);
      setError(null);

      try {
        await client.mutate("xmc.sites.deleteProfile", {
          params: {
            path: { id },
            query: { sitecoreContextId },
          },
        });

        return true;
      } catch (err) {
        // Handle 204 No Content response parsing error
        // The delete succeeds but SDK fails to parse empty response body
        if (err instanceof TypeError && 
            err.message.includes("Response with null body status cannot have body")) {
          // The delete was successful, just the response parsing failed
          return true;
        }
        
        console.error("Error deleting profile:", err);
        setError(err instanceof Error ? err.message : "Failed to delete profile");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [client, sitecoreContextId]
  );

  return {
    deleteProfile,
    isLoading,
    error,
  };
}

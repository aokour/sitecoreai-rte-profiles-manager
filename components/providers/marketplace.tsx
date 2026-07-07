"use client";

import {
  type ApplicationContext,
  ClientSDK,
} from "@sitecore-marketplace-sdk/client";
import { XMC } from "@sitecore-marketplace-sdk/xmc";
import type React from "react";
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { AeLogoAnimated } from "@/components/AeLogoAnimated";

interface ClientSDKProviderProps {
  children: ReactNode;
}

const ClientSDKContext = createContext<ClientSDK | null>(null);
const AppContextContext = createContext<ApplicationContext | null>(null);

export const MarketplaceProvider: React.FC<ClientSDKProviderProps> = ({
  children,
}) => {
  const [client, setClient] = useState<ClientSDK | null>(null);
  const [appContext, setAppContext] = useState<ApplicationContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  // "loading" → "fading" → "done" as the SDK becomes ready
  const [overlayStage, setOverlayStage] = useState<
    "loading" | "fading" | "done"
  >("loading");
  // Tracks whether enough time has passed for the full logo animation to play (~3.2s)
  const [minTimeReady, setMinTimeReady] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    if (client) {
      client.query("application.context").then((res) => {
        if (res?.data) {
          setAppContext(res.data);
          console.log("appContext", res.data);
        }
      });
    }
  }, [client]);

  useEffect(() => {
    const init = async () => {
      const config = {
        target: window.parent,
        modules: [XMC],
      };
      try {
        const client = await ClientSDK.init(config);
        setClient(client);
      } catch (error) {
        console.error("Error initializing client SDK", error);
        setError("Error initializing client SDK");
      }
    };

    init();
  }, []);

  // Minimum display time — enough for the full entrance animation (~2.3s) + brief pause
  useEffect(() => {
    const t = setTimeout(() => setMinTimeReady(true), 2200);
    return () => clearTimeout(t);
  }, []);

  // Mark SDK ready once both client and appContext are set
  useEffect(() => {
    if (client && appContext) {
      setTimeout(() => setSdkReady(true), 0);
    }
  }, [client, appContext]);

  // Start fade only when BOTH the animation has played AND the SDK is ready
  useEffect(() => {
    if (sdkReady && minTimeReady) {
      const t1 = setTimeout(() => setOverlayStage("fading"), 0);
      const t2 = setTimeout(() => setOverlayStage("done"), 500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [sdkReady, minTimeReady]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md text-center space-y-4 p-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-destructive">
              Connection Error
            </h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <div className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
            Please ensure this app is loaded within the Sitecore Marketplace
            parent window and the extension points are properly configured.
          </div>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {overlayStage !== "done" && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background pointer-events-none"
          style={{
            opacity: overlayStage === "fading" ? 0 : 1,
            transition: "opacity 0.5s ease-out",
          }}
        >
          <p
            className="text-2xl"
            style={{
              fontFamily: "var(--font-libre-franklin), sans-serif",
              fontWeight: 700,
              lineHeight: "normal",
              color: "#003057",
            }}
          >
            Editor Profile Visual Builder By
          </p>
          <AeLogoAnimated className="w-72" animate={true} />
        </div>
      )}
      {client && appContext && (
        <ClientSDKContext.Provider value={client}>
          <AppContextContext.Provider value={appContext}>
            {children}
          </AppContextContext.Provider>
        </ClientSDKContext.Provider>
      )}
    </>
  );
};

export const useMarketplaceClient = () => {
  const context = useContext(ClientSDKContext);
  if (!context) {
    throw new Error(
      "useMarketplaceClient must be used within a ClientSDKProvider",
    );
  }
  return context;
};

export const useAppContext = () => {
  const context = useContext(AppContextContext);
  if (!context) {
    throw new Error("useAppContext must be used within a ClientSDKProvider");
  }
  return context;
};

import { useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { syncQueue } from "../services/syncQueue";

// Hook: listens to network changes and triggers queue processing
export function useNetworkSync({ intervalMs = 30_000 } = {}) {
  useEffect(() => {
    let mounted = true;
    let intervalId = null;

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!mounted) return;
      if (state.isConnected) {
        // process immediately when back online
        syncQueue.process().catch(() => {});
      }
    });

    // periodic flush regardless of connectivity (best-effort)
    intervalId = setInterval(() => {
      syncQueue.process().catch(() => {});
    }, intervalMs);

    return () => {
      mounted = false;
      unsubscribe();
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalMs]);
}

export default useNetworkSync;

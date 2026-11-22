import { useEffect, useState } from "react";
import { pingServer } from "../services/api";

const SLOW_AFTER_MS = 1500;
const GIVE_UP_AFTER_MS = 90000;
const RETRY_DELAY_MS = 3000;

/**
 * "checking" -> first ping in flight
 * "waking"   -> still no answer after a moment (free-tier cold start)
 * "online"   -> API and database answered
 * "offline"  -> gave up; requests will probably fail
 */
const useServerStatus = () => {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;
    const started = Date.now();
    const slowTimer = setTimeout(() => {
      if (!cancelled) setStatus((s) => (s === "checking" ? "waking" : s));
    }, SLOW_AFTER_MS);

    const run = async () => {
      while (!cancelled) {
        if (await pingServer()) {
          if (!cancelled) setStatus("online");
          return;
        }
        if (Date.now() - started > GIVE_UP_AFTER_MS) {
          if (!cancelled) setStatus("offline");
          return;
        }
        if (!cancelled) setStatus("waking");
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    };
    run();

    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
  }, []);

  return status;
};

export default useServerStatus;

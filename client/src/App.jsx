import React, { useCallback, useEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Shortener from "./components/Shortener";
import RecentLinks from "./components/RecentLinks";
import { Faq, Footer, HowItWorks } from "./components/Sections";
import useServerStatus from "./hooks/useServerStatus";
import useTheme from "./hooks/useTheme";
import { getStats } from "./services/api";
import { addToHistory, loadHistory, saveHistory } from "./utils/history";

const App = () => {
  const status = useServerStatus();
  const { theme, toggle } = useTheme();
  const [history, setHistory] = useState(loadHistory);
  const [stats, setStats] = useState({});
  const [statsLoaded, setStatsLoaded] = useState(false);

  const updateHistory = useCallback((next) => {
    setHistory(next);
    saveHistory(next);
  }, []);

  const codesKey = useMemo(
    () => history.map((h) => h.urlCode).join(","),
    [history],
  );

  // Refresh click counts once the server is up and whenever the list changes.
  useEffect(() => {
    if (status !== "online" || codesKey === "") return;
    let cancelled = false;
    getStats(codesKey.split(","))
      .then((rows) => {
        if (cancelled) return;
        setStats(Object.fromEntries(rows.map((r) => [r.urlCode, r])));
        setStatsLoaded(true);
      })
      .catch(() => {
        /* counts are a nice-to-have; leave them blank */
      });
    return () => {
      cancelled = true;
    };
  }, [status, codesKey]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header status={status} theme={theme} onToggleTheme={toggle} />

      <main id="top" className="flex-1">
        <section className="container-page pt-12 pb-6 sm:pt-20">
          <p className="eyebrow mb-3">Free · No sign-up · 90-day links</p>
          <h1 className="font-display mb-4 max-w-3xl text-4xl leading-[1.05] font-bold tracking-tight sm:text-6xl">
            Make long links{" "}
            <span className="rounded-lg bg-accent px-2 text-accent-ink">
              short
            </span>
            .
          </h1>
          <p className="mb-8 max-w-xl text-lg text-muted">
            Paste a link and get a short one you can share anywhere. Pick your
            own alias, grab a QR code, and see how many clicks it gets.
          </p>

          <Shortener
            status={status}
            onCreated={(link) => updateHistory(addToHistory(history, link))}
          />

          <RecentLinks
            items={history}
            stats={stats}
            statsLoaded={statsLoaded}
            onRemove={(code) =>
              updateHistory(history.filter((h) => h.urlCode !== code))
            }
            onClear={() => updateHistory([])}
          />
        </section>

        <HowItWorks />
        <Faq />
      </main>

      <Footer />
    </div>
  );
};

export default App;

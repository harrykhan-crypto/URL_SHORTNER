import React, { useState } from "react";
import { HiOutlineArrowRight } from "react-icons/hi2";
import { shortenUrl } from "../services/api";
import ResultCard from "./ResultCard";

const Shortener = ({ status, onCreated }) => {
  const [longUrl, setLongUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [showAlias, setShowAlias] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const link = await shortenUrl(longUrl, showAlias ? alias : "");
      setResult(link);
      onCreated(link);
      setLongUrl("");
      setAlias("");
      setShowAlias(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const host = typeof window !== "undefined" ? window.location.host : "";

  return (
    <div className="card p-5 sm:p-7">
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="longUrl" className="mb-2 block text-sm font-semibold">
          Paste a long link
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="longUrl"
            type="text"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="https://example.com/a/very/long/link"
            className="field sm:text-lg"
            value={longUrl}
            onChange={(e) => {
              setLongUrl(e.target.value);
              setError("");
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "shorten-error" : undefined}
            required
          />
          <button
            type="submit"
            disabled={loading || longUrl.trim() === ""}
            className="btn btn-primary shrink-0 px-6 py-3.5 text-base"
          >
            {loading ? "Shortening…" : "Shorten"}
            {!loading && <HiOutlineArrowRight aria-hidden="true" />}
          </button>
        </div>

        <div className="mt-3">
          {showAlias ? (
            <div>
              <label
                htmlFor="alias"
                className="mb-2 block text-sm font-semibold"
              >
                Custom alias{" "}
                <span className="font-normal text-muted">(optional)</span>
              </label>
              <div className="flex items-stretch overflow-hidden rounded-xl border-2 border-line bg-surface focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--focus)_35%,transparent)]">
                <span className="hidden items-center border-r-2 border-line bg-surface-2 px-3 text-sm text-muted sm:flex">
                  {host}/
                </span>
                <input
                  id="alias"
                  type="text"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={32}
                  placeholder="my-link"
                  className="w-full min-w-0 bg-transparent px-4 py-3 text-base text-ink placeholder:text-muted/70 focus:outline-none"
                  value={alias}
                  onChange={(e) => {
                    setAlias(e.target.value);
                    setError("");
                  }}
                  aria-describedby="alias-hint"
                />
              </div>
              <p id="alias-hint" className="mt-1.5 text-xs text-muted">
                3–32 letters, numbers, hyphens or underscores.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAlias(true)}
              className="text-sm font-semibold underline underline-offset-4 hover:no-underline"
            >
              + Add a custom alias
            </button>
          )}
        </div>

        {error && (
          <p
            id="shorten-error"
            role="alert"
            className="mt-4 rounded-xl border-2 border-danger bg-danger-bg px-4 py-3 text-sm font-medium text-danger"
          >
            {error}
          </p>
        )}

        {!error && status === "waking" && (
          <p className="mt-4 text-sm text-muted" role="status">
            The server is waking up after being idle. Your first link can take
            up to a minute.
          </p>
        )}
        {!error && status === "offline" && (
          <p className="mt-4 text-sm text-danger" role="status">
            Can't reach the server right now. Please try again in a moment.
          </p>
        )}
      </form>

      {result && <ResultCard key={result.urlCode} link={result} />}
    </div>
  );
};

export default Shortener;

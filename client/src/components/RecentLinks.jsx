import React from "react";
import {
  HiOutlineCheck,
  HiOutlineClipboard,
  HiOutlineXMark,
} from "react-icons/hi2";
import useCopy from "../hooks/useCopy";
import { daysLeft, displayUrl } from "../utils/history";

const clicksLabel = (n) => `${n} ${n === 1 ? "click" : "clicks"}`;

const LinkRow = ({ item, stats, statsLoaded, onRemove }) => {
  const { copy, copied } = useCopy();
  const expired = statsLoaded && !stats;
  const left = daysLeft(item.createdAt);

  let destHost = item.longUrl;
  try {
    destHost = new URL(item.longUrl).hostname.replace(/^www\./, "");
  } catch {
    /* keep raw */
  }

  return (
    <li className="flex items-center gap-3 border-t-2 border-line px-4 py-3 first:border-t-0 sm:px-5">
      <div className="min-w-0 flex-1">
        {expired ? (
          <p className="font-display truncate font-bold text-muted line-through">
            {displayUrl(item.shortUrl)}
          </p>
        ) : (
          <a
            href={item.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display block truncate font-bold hover:underline"
          >
            {displayUrl(item.shortUrl)}
          </a>
        )}
        <p className="truncate text-sm text-muted" title={item.longUrl}>
          → {destHost}
        </p>
        <p className="text-xs text-muted sm:hidden">
          {expired
            ? "Expired"
            : `${stats ? `${clicksLabel(stats.clicks)} · ` : ""}${left} days left`}
        </p>
      </div>

      <div className="hidden shrink-0 text-right text-sm sm:block">
        {expired ? (
          <span className="font-semibold text-muted">Expired</span>
        ) : (
          <>
            <p className="font-semibold">
              {stats ? clicksLabel(stats.clicks) : "—"}
            </p>
            <p className="text-xs text-muted">{left} days left</p>
          </>
        )}
      </div>

      {!expired && (
        <button
          type="button"
          onClick={() => copy(item.shortUrl)}
          className="icon-btn shrink-0"
          aria-label={copied ? "Copied" : `Copy ${displayUrl(item.shortUrl)}`}
        >
          {copied ? <HiOutlineCheck /> : <HiOutlineClipboard />}
        </button>
      )}
      <button
        type="button"
        onClick={() => onRemove(item.urlCode)}
        className="icon-btn shrink-0"
        aria-label={`Remove ${displayUrl(item.shortUrl)} from this list`}
      >
        <HiOutlineXMark />
      </button>
    </li>
  );
};

const RecentLinks = ({ items, stats, statsLoaded, onRemove, onClear }) => {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="recent-heading" className="mt-10">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 id="recent-heading" className="font-display text-xl font-bold">
            Your recent links
          </h2>
          <p className="text-sm text-muted">Saved in this browser only.</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-semibold underline underline-offset-4 hover:no-underline"
        >
          Clear list
        </button>
      </div>
      <ul className="card overflow-hidden">
        {items.map((item) => (
          <LinkRow
            key={item.urlCode}
            item={item}
            stats={stats[item.urlCode]}
            statsLoaded={statsLoaded}
            onRemove={onRemove}
          />
        ))}
      </ul>
    </section>
  );
};

export default RecentLinks;

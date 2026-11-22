import React, { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  HiOutlineArrowTopRightOnSquare,
  HiOutlineArrowDownTray,
  HiOutlineCheck,
  HiOutlineClipboard,
  HiOutlineQrCode,
} from "react-icons/hi2";
import useCopy from "../hooks/useCopy";
import { displayUrl, expiryDate } from "../utils/history";

const ResultCard = ({ link }) => {
  const { copy, copied, failed } = useCopy();
  const [showQr, setShowQr] = useState(false);
  const qrRef = useRef(null);

  const downloadQr = () => {
    const canvas = qrRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${link.urlCode}-qr.png`;
    a.click();
  };

  const expires = expiryDate(link.createdAt).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="mt-6 rounded-xl border-2 border-line bg-surface-2 p-4 sm:p-5">
      <p className="eyebrow mb-2">Your short link</p>
      <a
        href={link.shortUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-display block text-xl font-bold [overflow-wrap:anywhere] hover:underline sm:text-3xl"
      >
        {displayUrl(link.shortUrl)}
      </a>
      <p className="mt-2 truncate text-sm text-muted" title={link.longUrl}>
        → {link.longUrl}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap [&>*]:px-3 sm:[&>*]:px-5">
        <button
          type="button"
          onClick={() => copy(link.shortUrl)}
          className="btn btn-primary"
        >
          {copied ? <HiOutlineCheck /> : <HiOutlineClipboard />}
          {copied ? "Copied!" : "Copy"}
        </button>
        <a
          href={link.shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost"
        >
          <HiOutlineArrowTopRightOnSquare /> Open
        </a>
        <button
          type="button"
          onClick={() => setShowQr((v) => !v)}
          aria-expanded={showQr}
          className={`btn ${showQr ? "bg-surface-2 text-ink" : "btn-ghost"}`}
        >
          <HiOutlineQrCode /> QR
        </button>
      </div>

      {failed && (
        <p className="mt-3 text-sm font-medium text-danger" role="alert">
          Couldn't copy automatically. Select the link above and copy it.
        </p>
      )}

      {showQr && (
        <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-end">
          <div className="rounded-xl border-2 border-line bg-white p-2">
            <QRCodeCanvas
              ref={qrRef}
              value={link.shortUrl}
              size={176}
              marginSize={1}
              bgColor="#ffffff"
              fgColor="#0b0b0b"
              aria-label={`QR code for ${link.shortUrl}`}
            />
          </div>
          <button type="button" onClick={downloadQr} className="btn btn-ghost">
            <HiOutlineArrowDownTray /> Download PNG
          </button>
        </div>
      )}

      <p className="mt-4 text-xs text-muted">Works until {expires}.</p>
    </div>
  );
};

export default ResultCard;

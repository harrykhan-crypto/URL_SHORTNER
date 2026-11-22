import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Logo from "./Logo";
import { pingServer } from "../services/api";

// Give up waiting after this long and let the user in anyway; requests will
// still work (just slowly) once the server finishes waking.
const MAX_WAIT_MS = 60000;
const RETRY_DELAY_MS = 3000;

const BootScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Waking Up...");
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let cancelled = false;
    let finishTimer;
    const started = Date.now();

    // Creep toward 90% while waiting; the last 10% happens when the server answers.
    const progressTimer = setInterval(() => {
      setProgress((p) => (p < 90 ? p + 1 : p));
    }, 150);

    const finish = (label) => {
      if (cancelled) return;
      clearInterval(progressTimer);
      setStatus(label);
      setProgress(100);
      finishTimer = setTimeout(() => onCompleteRef.current(), 400);
    };

    const wake = async () => {
      while (!cancelled) {
        if (await pingServer()) return finish("Online");
        if (Date.now() - started > MAX_WAIT_MS) return finish("Slow Start");
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    };
    wake();

    return () => {
      cancelled = true;
      clearInterval(progressTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center p-6"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-xs w-full">
        <div className="mb-12 flex justify-center">
          <Logo
            className="w-10 h-10"
            textClassName="text-xl font-black tracking-tighter uppercase"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em]">
            <span>Initialising Protocol</span>
            <span>{progress}%</span>
          </div>

          {/* Brutalist Progress Bar */}
          <div className="w-full h-4 border-2 border-black p-0.5">
            <motion.div
              className="h-full bg-black"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="space-y-1">
              <p className="text-[8px] font-bold text-neutral-300 uppercase tracking-widest">
                Database
              </p>
              <p className="text-[10px] font-black uppercase tracking-tight">
                Handshake
              </p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[8px] font-bold text-neutral-300 uppercase tracking-widest">
                Server
              </p>
              <p className="text-[10px] font-black uppercase tracking-tight">
                {status}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BootScreen;

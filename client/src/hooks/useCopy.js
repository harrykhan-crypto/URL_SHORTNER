import { useEffect, useRef, useState } from "react";

/** Copy text to the clipboard; `copied` flips back after 2s. */
const useCopy = () => {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef();

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async (text) => {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(text);
      setFailed(false);
      setCopied(true);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
    }
  };

  return { copy, copied, failed };
};

export default useCopy;

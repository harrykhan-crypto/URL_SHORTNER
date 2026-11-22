import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import BootScreen from "./components/BootScreen";

const hasBootedThisSession = () => {
  try {
    return sessionStorage.getItem("hasBooted") === "true";
  } catch {
    return false;
  }
};

const App = () => {
  const [isBooting, setIsBooting] = useState(() => !hasBootedThisSession());

  const handleBootComplete = () => {
    try {
      sessionStorage.setItem("hasBooted", "true");
    } catch {
      /* storage unavailable (private mode); boot screen will show again */
    }
    setIsBooting(false);
  };

  return (
    <>
      <AnimatePresence>
        {isBooting && <BootScreen onComplete={handleBootComplete} />}
      </AnimatePresence>

      {!isBooting && (
        <MainLayout>
          <Home />
        </MainLayout>
      )}
    </>
  );
};

export default App;

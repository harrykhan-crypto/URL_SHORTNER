import React from "react";
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi2";
import Logo from "./Logo";
import StatusPill from "./StatusPill";

const Header = ({ status, theme, onToggleTheme }) => (
  <header className="sticky top-0 z-50 border-b-2 border-line bg-bg/90 backdrop-blur">
    <div className="container-page flex h-16 items-center justify-between gap-3">
      <a href="#top" className="flex items-center" aria-label="MakeLink home">
        <Logo
          className="h-6 w-6"
          textClassName="font-display text-lg font-bold tracking-tight"
        />
      </a>
      <nav className="flex items-center gap-2 sm:gap-5">
        <a
          href="#how"
          className="hidden text-sm font-semibold hover:underline sm:inline"
        >
          How it works
        </a>
        <a
          href="#faq"
          className="hidden text-sm font-semibold hover:underline sm:inline"
        >
          FAQ
        </a>
        <StatusPill status={status} />
        <button
          type="button"
          onClick={onToggleTheme}
          className="icon-btn"
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {theme === "dark" ? <HiOutlineSun /> : <HiOutlineMoon />}
        </button>
      </nav>
    </div>
  </header>
);

export default Header;

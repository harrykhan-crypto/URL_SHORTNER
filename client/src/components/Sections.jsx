import React from "react";
import {
  HiOutlineChartBar,
  HiOutlineClipboardDocument,
  HiOutlineLink,
  HiOutlineMinus,
  HiOutlinePlus,
} from "react-icons/hi2";

const STEPS = [
  {
    icon: HiOutlineClipboardDocument,
    title: "Paste your link",
    text: "Any http or https address works. Add a custom alias if you want a name people can remember.",
  },
  {
    icon: HiOutlineLink,
    title: "Share the short one",
    text: "Copy it, open it, or download a QR code for posters, menus and slides.",
  },
  {
    icon: HiOutlineChartBar,
    title: "See the clicks",
    text: "Your recent links show how many times each one has been opened.",
  },
];

export const HowItWorks = () => (
  <section id="how" className="container-page scroll-mt-20 py-16 sm:py-20">
    <p className="eyebrow mb-2">How it works</p>
    <h2 className="font-display mb-8 text-3xl font-bold sm:text-4xl">
      Three steps, no account.
    </h2>
    <ol className="grid gap-4 sm:grid-cols-3">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <li key={step.title} className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 border-line bg-accent text-accent-ink text-xl">
                <Icon aria-hidden="true" />
              </span>
              <span className="font-display text-sm font-bold text-muted">
                0{i + 1}
              </span>
            </div>
            <h3 className="font-display mb-1 text-lg font-bold">
              {step.title}
            </h3>
            <p className="text-sm text-muted">{step.text}</p>
          </li>
        );
      })}
    </ol>
  </section>
);

const FAQS = [
  {
    q: "Is it free?",
    a: "Yes. There's no sign-up and no paid plan.",
  },
  {
    q: "How long do links last?",
    a: "90 days from when they're created. After that they're deleted automatically and stop working.",
  },
  {
    q: "Can I choose the short link?",
    a: "Yes. Click “Add a custom alias” and pick 3–32 letters, numbers, hyphens or underscores. Aliases are first come, first served.",
  },
  {
    q: "Where are my recent links stored?",
    a: "Only in this browser. Clearing your browser data or switching devices empties the list, but the links themselves keep working.",
  },
  {
    q: "Is it safe?",
    a: "Only http and https destinations are accepted, and the service is rate limited. We don't scan destination sites, so only open short links from people you trust.",
  },
];

const ANALYTICS_FAQ = {
  q: "Do you use analytics?",
  a: "This website uses Microsoft Clarity to understand how visitors use the page. Opening a short link only adds one to its click count; no personal data is stored with your links.",
};

const FaqItem = ({ q, a, id }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-t-2 border-line first:border-t-0">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={id}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold hover:bg-surface-2"
        >
          {q}
          {open ? (
            <HiOutlineMinus className="shrink-0" aria-hidden="true" />
          ) : (
            <HiOutlinePlus className="shrink-0" aria-hidden="true" />
          )}
        </button>
      </h3>
      <div id={id} hidden={!open} className="px-5 pb-4 text-sm text-muted">
        {a}
      </div>
    </div>
  );
};

export const Faq = () => {
  const items = import.meta.env.VITE_CLARITY_ID
    ? [...FAQS, ANALYTICS_FAQ]
    : FAQS;
  return (
    <section id="faq" className="container-page scroll-mt-20 pb-16 sm:pb-20">
      <p className="eyebrow mb-2">FAQ</p>
      <h2 className="font-display mb-8 text-3xl font-bold sm:text-4xl">
        Questions, answered.
      </h2>
      <div className="card overflow-hidden">
        {items.map((f, i) => (
          <FaqItem key={f.q} q={f.q} a={f.a} id={`faq-${i}`} />
        ))}
      </div>
    </section>
  );
};

export const Footer = () => (
  <footer className="border-t-2 border-line">
    <div className="container-page flex flex-col gap-4 py-8 text-sm text-muted">
      <p>
        MakeLink is a free, neutral redirect tool provided as-is. People who
        create links are responsible for where they point. Links that break the
        law or are used for phishing or malware may be removed.
      </p>
      <p>
        Originally designed by{" "}
        <a
          href="https://saad-shaikh.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-ink underline underline-offset-4"
        >
          Saad Shaikh
        </a>
        .
      </p>
    </div>
  </footer>
);

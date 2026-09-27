/**
 * Static content for the marketing landing page.
 * Kept out of components so every section stays presentational.
 */

export type Hue = "emerald" | "amber" | "blue" | "violet" | "rose" | "cyan";

export const hueClasses: Record<Hue, string> = {
  emerald: "bg-emerald-500/10 text-emerald-700 ring-emerald-600/25",
  amber: "bg-amber-500/10 text-amber-700 ring-amber-600/25",
  blue: "bg-blue-500/10 text-blue-700 ring-blue-600/25",
  violet: "bg-violet-500/10 text-violet-700 ring-violet-600/25",
  rose: "bg-rose-500/10 text-rose-700 ring-rose-600/25",
  cyan: "bg-cyan-500/10 text-cyan-700 ring-cyan-600/25",
};

export const hueClassesDark: Record<Hue, string> = {
  emerald: "bg-emerald-500/12 text-emerald-300 ring-emerald-500/25",
  amber: "bg-amber-500/12 text-amber-300 ring-amber-500/25",
  blue: "bg-blue-500/12 text-blue-300 ring-blue-500/25",
  violet: "bg-violet-500/12 text-violet-300 ring-violet-500/25",
  rose: "bg-rose-500/12 text-rose-300 ring-rose-500/25",
  cyan: "bg-cyan-500/12 text-cyan-300 ring-cyan-500/25",
};

/* ── Marquee ─────────────────────────────────────────────────────── */

export const marqueeWords = [
  "Medical clinics",
  "Salons & spas",
  "Banks",
  "Retail counters",
  "Government offices",
  "Pharmacies",
  "Repair & pickup",
  "Dental practices",
  "Municipal services",
  "Auto service",
  "Opticians",
  "Service centres",
];

/* ── Industries index ────────────────────────────────────────────── */

export interface Industry {
  number: string;
  name: string;
  description: string;
  hue: Hue;
  /** Configuration shown in the sticky vignette — illustrative, not live data. */
  queues: { name: string; point: string; pace: string }[];
  note: string;
}

export const industries: Industry[] = [
  {
    number: "01",
    name: "Healthcare & clinics",
    description:
      "Patients check in from the waiting room or from home, and staff control the flow across consultation rooms.",
    hue: "emerald",
    queues: [
      { name: "General consultation", point: "Room 1–4", pace: "8 min / patient" },
      { name: "Diagnostics", point: "Lab desk", pace: "5 min / sample" },
      { name: "Pharmacy counter", point: "Window B", pace: "3 min / script" },
    ],
    note: "Reception keeps one screen. Patients keep their seat.",
  },
  {
    number: "02",
    name: "Beauty & salons",
    description:
      "Walk-ins take a token and leave for a coffee instead of occupying every chair in the reception.",
    hue: "rose",
    queues: [
      { name: "Cut & style", point: "Stations 1–3", pace: "35 min / guest" },
      { name: "Colour service", point: "Back bar", pace: "70 min / guest" },
      { name: "Walk-in trim", point: "Front chair", pace: "15 min / guest" },
    ],
    note: "No clipboards. No guessing who arrived first.",
  },
  {
    number: "03",
    name: "Banking & finance",
    description:
      "Branch staff separate service types into desks so teller traffic and advisory meetings stop competing.",
    hue: "blue",
    queues: [
      { name: "Teller desk", point: "Counter 1–2", pace: "4 min / customer" },
      { name: "Advisory", point: "Cabin A", pace: "20 min / meeting" },
      { name: "Documents", point: "Service desk", pace: "6 min / file" },
    ],
    note: "Queue priority without a queue number board.",
  },
  {
    number: "04",
    name: "Retail & counters",
    description:
      "Returns, click-and-collect and personal shopping each get their own line — served from one view.",
    hue: "amber",
    queues: [
      { name: "Returns", point: "Desk 1", pace: "5 min / item" },
      { name: "Click & collect", point: "Pickup point", pace: "2 min / order" },
      { name: "Customer desk", point: "Floor", pace: "7 min / query" },
    ],
    note: "Peak hours stop meaning peak chaos.",
  },
  {
    number: "05",
    name: "Government & service centres",
    description:
      "Permits, licensing and citizen services run long, formal queues — Qzen makes them visible and fair.",
    hue: "violet",
    queues: [
      { name: "Permits & licensing", point: "Counter 3", pace: "12 min / file" },
      { name: "Citizen enquiries", point: "Counter 1–2", pace: "9 min / visit" },
      { name: "Collections", point: "Window D", pace: "4 min / pickup" },
    ],
    note: "A public queue the public can actually see.",
  },
  {
    number: "06",
    name: "Repair & pickup services",
    description:
      "Devices, vehicles and orders move through intake, service and collection as tracked stages.",
    hue: "cyan",
    queues: [
      { name: "Intake", point: "Front desk", pace: "6 min / item" },
      { name: "Service bay", point: "Workshop", pace: "25 min / job" },
      { name: "Collection", point: "Handover", pace: "3 min / order" },
    ],
    note: "Customers collect when you say collect.",
  },
];

/* ── How it works ────────────────────────────────────────────────── */

export const steps = [
  {
    number: "01",
    title: "Scan",
    description:
      "A QR code or a short link opens the queue. Nothing to install, nothing to sign up for.",
  },
  {
    number: "02",
    title: "Join",
    description:
      "The customer gets a token in seconds and watches their position move from their own phone.",
  },
  {
    number: "03",
    title: "Serve",
    description:
      "Staff call the next person from one screen. Every action is timestamped as the queue moves.",
  },
];

/* ── Capability ledger ───────────────────────────────────────────── */

export const capabilities = [
  {
    number: "01",
    title: "Live queue position",
    description:
      "Customers always see their token, who is ahead of them, and how the line is moving.",
  },
  {
    number: "02",
    title: "Estimated wait",
    description:
      "Built from each queue's average service time, so people can plan their visit with confidence.",
  },
  {
    number: "03",
    title: "Real-time updates",
    description:
      "Every call, pause and completion is pushed over the wire — no refreshing, no stale numbers.",
  },
  {
    number: "04",
    title: "Staff console",
    description:
      "Call next, complete or skip from a single view built for a counter, not a keyboard.",
  },
  {
    number: "05",
    title: "QR and link access",
    description:
      "Each queue has its own address. Print it, post it, or send it — customers join either way.",
  },
  {
    number: "06",
    title: "Multiple queues",
    description:
      "Run several service points side by side, each with its own pace, status and history.",
  },
  {
    number: "07",
    title: "Day-by-day history",
    description:
      "Every session is archived by date, so yesterday's rush is a record rather than a memory.",
  },
  {
    number: "08",
    title: "Analytics",
    description:
      "Joined versus served across the day shows exactly where service time is being spent.",
  },
];

/* ── Trust ledger ────────────────────────────────────────────────── */

export const proofPoints = [
  { value: "0", label: "App downloads for customers" },
  { value: "1", label: "Link or QR code to join" },
  { value: "10s", label: "From scan to token" },
  { value: "24/7", label: "Queue history, timestamped" },
];

export const switchReasons = [
  {
    title: "The line leaves the doorway",
    description:
      "Customers wait where they choose — in the car, at a café, in their seat — and return when called.",
  },
  {
    title: "Staff stop managing people",
    description:
      "One screen replaces clipboards, paper slips and shouted numbers. The team serves instead of queueing.",
  },
  {
    title: "Everyone sees the same thing",
    description:
      "The customer's position, the counter's list and the day's record come from one shared state.",
  },
];

/* ── FAQ ─────────────────────────────────────────────────────────── */

export const faqs = [
  {
    question: "Do customers need to download an app?",
    answer:
      "No. Qzen runs in the browser a customer already has. Scanning a QR code or opening a link is the entire setup.",
  },
  {
    question: "How does a customer join the queue?",
    answer:
      "Each queue has its own link and QR code. The customer opens it, enters their name, and receives a token with their live position — no account required.",
  },
  {
    question: "Can one business run several queues at once?",
    answer:
      "Yes. A business can create any number of queues — separate counters, services or appointment types — and manage them from the same dashboard.",
  },
  {
    question: "What happens when a customer doesn't show up?",
    answer:
      "Staff can skip a token and move on. The action is recorded, and the queue keeps flowing without anyone losing their place in line.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Create the workspace, name the first queue, and share the link. A business can be taking customers the same day.",
  },
  {
    question: "Does it work on a phone?",
    answer:
      "Both sides do. Customers join from any phone browser, and staff can run the console from a phone, tablet or counter computer.",
  },
];

"use client";

import {
  FormEvent,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { io } from "socket.io-client";
import { motion } from "motion/react";
import QueueTicket, {
  QueueTicketSkeleton,
  type TicketStatus,
} from "@/components/customer/QueueTicket";
import NotificationOptIn from "@/components/customer/NotificationOptIn";
import { Field } from "@/components/customer/ui";
import {
  cardClass,
  eyebrowClass,
  errorClass,
  fadeUp,
  headingClass,
  inputClass,
  primaryButtonClass,
} from "@/components/customer/styles";

interface JoinQueueFormProps {
  queueId: string;
  queueStatus: string;
  businessName: string;
  queueName: string;
}

/**
 * localStorage is not a reactive store: every write below is paired with a
 * state update, which makes React re-read the snapshot, so there is nothing to
 * subscribe to. React only requires the function to exist (and to be stable).
 */
const subscribeToTicketStorage = () => () => {};

/**
 * Every ticket read goes through this.
 *
 * localStorage throws a SecurityError when it is blocked — a third-party
 * frame, "block all cookies", or a restrictive webview. A customer who cannot
 * store a ticket must still get the queue, so an unreadable store degrades to
 * "no saved ticket" rather than taking the page down.
 */
function readSavedTicket(queueId: string): string | null {
  try {
    return localStorage.getItem(`qzen-ticket-${queueId}`);
  } catch {
    return null;
  }
}

export default function JoinQueueForm({
  queueId,
  queueStatus,
  businessName,
  queueName,
}: JoinQueueFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  const [entryId, setEntryId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : readSavedTicket(queueId),
  );
  const [tokenNumber, setTokenNumber] = useState<number | null>(null);

  // The ticket lives in localStorage, but this component is server rendered,
  // so the first paint must not depend on it. React reports the *server*
  // snapshot during SSR and hydration — `undefined` — then swaps in the
  // device's value on the next render. That handover is what `checked` waits
  // for: until it resolves we render the ticket silhouette rather than the
  // join form, so a returning customer never sees an empty form they could
  // submit a second time, while the hydrated markup still matches the HTML
  // the server sent.
  const savedTicketId = useSyncExternalStore(
    subscribeToTicketStorage,
    (): string | null | undefined => readSavedTicket(queueId),
    (): string | null | undefined => undefined,
  );
  const checked = savedTicketId !== undefined;

  // Read lazily rather than in an effect: a device that already holds a ticket
  // starts out restoring, so we fetch its status before swapping the
  // silhouette for the ticket. `fetchStatus` clears it in its `finally` block
  // on every path, so this can never strand a customer on the silhouette.
  const [restoring, setRestoring] = useState(
    () => typeof window !== "undefined" && readSavedTicket(queueId) !== null,
  );

  const [currentToken, setCurrentToken] = useState<number | null>(null);
  const [peopleAhead, setPeopleAhead] = useState<number | null>(null);
  const [estimatedWait, setEstimatedWait] = useState<number | null>(null);
  const [customerStatus, setCustomerStatus] = useState("waiting");
  const [currentQueueStatus, setCurrentQueueStatus] = useState(queueStatus);

  // useEffect(() => {
  //   const savedEntryId = localStorage.getItem(`qzen-ticket-${queueId}`);

  //   if (savedEntryId) {
  //     setEntryId(savedEntryId);
  //   }
  // }, [queueId]);

  useEffect(() => {
    async function fetchStatus() {
      if (entryId === null) {
        return;
      }

      try {
        const response = await fetch(
          `/api/queues/${queueId}/status/${entryId}`,
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(data.message);
          return;
        }

        if (!data.isCurrentSession) {
          localStorage.removeItem(`qzen-ticket-${queueId}`);
          setEntryId(null);
          setTokenNumber(null);
          setCustomerStatus("waiting");
          return;
        }

        setTokenNumber(data.tokenNumber);
        setCurrentToken(data.currentToken);
        setPeopleAhead(data.peopleAhead);
        setEstimatedWait(data.estimatedWait);
        setCustomerStatus(data.status);
        setCurrentQueueStatus(data.queueStatus);
      } catch (error) {
        console.error("Queue status error:", error);
      } finally {
        setRestoring(false);
      }
    }

    fetchStatus();

    const socket = io();

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);

      socket.emit("joinQueue", queueId);
    });

    socket.on("queueUpdated", (data) => {
      console.log("Queue updated:", data);

      if (data.status) {
        setCurrentQueueStatus(data.status);
      }

      if (entryId !== null) {
        fetchStatus();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [queueId, entryId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!customerName.trim()) {
      setError("Please enter your name.");
      return;
    }

    try {
      setIsJoining(true);

      const response = await fetch(`/api/queues/${queueId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to join queue.");
        return;
      }

      const newEntryId = data.entry._id;
      const newToken = data.entry.tokenNumber;

      try {
        localStorage.setItem(`qzen-ticket-${queueId}`, newEntryId);
      } catch {
        // Storage is blocked: the ticket still works for this session, it
        // simply cannot survive a reload. Swallowing this keeps a successful
        // join from reporting a failure the customer did not cause.
      }

      setEntryId(newEntryId);
      setTokenNumber(newToken);
    } catch (error) {
      console.error("Join queue error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsJoining(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────

  if (!checked || restoring) {
    return <QueueTicketSkeleton />;
  }

  if (entryId !== null && tokenNumber !== null) {
    const ticketStatus: TicketStatus =
      customerStatus === "serving" ||
      customerStatus === "skipped" ||
      customerStatus === "completed"
        ? customerStatus
        : "waiting";

    return (
      <div className="flex w-full max-w-md flex-col">
        <QueueTicket
          businessName={businessName}
          queueName={queueName}
          tokenNumber={tokenNumber}
          currentToken={currentToken}
          peopleAhead={peopleAhead}
          estimatedWait={estimatedWait}
          status={ticketStatus}
        />

        {/* Only while waiting: once served or finished there is nothing
            left to announce, and the subscribe API would reject it. */}
        {ticketStatus === "waiting" ? (
          <NotificationOptIn
            queueId={queueId}
            queueEntryId={entryId}
          />
        ) : null}
      </div>
    );
  }

  if (currentQueueStatus === "paused" || currentQueueStatus === "closed") {
    const paused = currentQueueStatus === "paused";

    return (
      <motion.section {...fadeUp(0.05)} className={cardClass}>
        <div className="text-center">
          <p className={eyebrowClass}>{businessName}</p>
          <h1 className={`mt-3 ${headingClass}`}>{queueName}</h1>
        </div>

        <div
          className={`mt-7 rounded-2xl border px-5 py-5 ${
            paused
              ? "border-amber-200 bg-amber-50"
              : "border-red-200 bg-red-50"
          }`}
          role="status"
        >
          <p
            className={`font-mono text-[10px] font-semibold uppercase tracking-[0.2em] ${
              paused ? "text-amber-700" : "text-red-700"
            }`}
          >
            {paused ? "Queue paused" : "Queue closed"}
          </p>

          <p className="mt-3 text-[16px] font-semibold leading-snug text-ink-text">
            {paused
              ? "This queue is temporarily paused."
              : "This queue is currently closed."}
          </p>

          <p className="mt-2 text-[13.5px] leading-[1.6] text-ink-text-2">
            {paused
              ? "New customers cannot join right now. Please try again later."
              : "New customers cannot join this queue right now."}
          </p>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section {...fadeUp(0.05)} className={cardClass}>
      <motion.div {...fadeUp(0.12)} className="text-center">
        <p className={eyebrowClass}>{businessName}</p>
        <h1 className={`mt-3 ${headingClass}`}>{queueName}</h1>
        <p className="mt-2.5 text-[15px] leading-6 text-ink-text-2">
          Join from your phone — it only takes a moment.
        </p>
      </motion.div>

      <motion.div {...fadeUp(0.2)} className="mt-7">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field id="customerName" label="Your name">
            <input
              id="customerName"
              type="text"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Enter your name"
              autoComplete="name"
              className={inputClass}
            />
          </Field>

          {error && (
            <p role="alert" className={errorClass}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isJoining}
            className={primaryButtonClass}
          >
            {isJoining ? "Joining…" : "Join Queue"}
          </button>
        </form>
      </motion.div>

      <motion.p
        {...fadeUp(0.28)}
        className="mt-5 text-center text-[12.5px] leading-6 text-ink-text-3"
      >
        No app needed — your ticket opens right here.
      </motion.p>
    </motion.section>
  );
}

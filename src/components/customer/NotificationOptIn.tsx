"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { EASE } from "./styles";

/**
 * Browser push opt-in for a customer ticket.
 *
 * Rendered only under a live (waiting) ticket, and only ever entered
 * through an explicit click: permission is requested from the button
 * handler, never on mount and never on queue join. A previously denied
 * permission is never re-prompted — the UI degrades to a note pointing at
 * the browser settings instead.
 *
 * States handled: unsupported browser/SW (renders nothing), permission
 * granted (silently resyncs the subscription), permission denied (note,
 * no prompt), unconfigured server (503 from GET), and any failure during
 * subscribe (inline error with retry).
 */

interface NotificationOptInProps {
  queueId: string;
  queueEntryId: string;
}

type Phase =
  | "checking" // probing permission + support
  | "unsupported" // no Notification/SW/PushManager → render nothing
  | "off" // permission not granted (or opted out) → show the button
  | "enabling" // request/subscribe in flight
  | "on" // subscribed and stored server-side
  | "denied" // permission blocked → note only, never re-prompt
  | "error"; // subscribe failed → message + retry

/**
 * localStorage is optional here too: a blocked store just means the
 * "turned off" choice lasts for this page view rather than persisting.
 */
function readOptOut(queueId: string): boolean {
  try {
    return localStorage.getItem(`qzen-push-off-${queueId}`) === "1";
  } catch {
    return false;
  }
}

function writeOptOut(queueId: string, off: boolean) {
  try {
    if (off) {
      localStorage.setItem(`qzen-push-off-${queueId}`, "1");
    } else {
      localStorage.removeItem(`qzen-push-off-${queueId}`);
    }
  } catch {
    // Storage blocked: the in-memory phase still governs this page view.
  }
}

/** base64url VAPID public key → bytes for `applicationServerKey`. */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  // Backed by a plain ArrayBuffer (not SharedArrayBuffer) so the value
  // satisfies `BufferSource` as the Push API expects.
  const output = new Uint8Array(new ArrayBuffer(raw.length));

  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }

  return output;
}

function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export default function NotificationOptIn({
  queueId,
  queueEntryId,
}: NotificationOptInProps) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [message, setMessage] = useState("");

  /**
   * Registers the service worker and ensures a PushSubscription exists
   * for this browser, then persists it for this ticket. Shared by the
   * click flow and the granted-permission resync so both paths are
   * byte-for-byte identical from the server's point of view.
   */
  const subscribe = useCallback(async (): Promise<
    "ok" | "unconfigured" | "failed"
  > => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");

      const keyResponse = await fetch("/api/notifications/subscribe");

      if (keyResponse.status === 503) {
        return "unconfigured";
      }

      if (!keyResponse.ok) {
        return "failed";
      }

      const { publicKey } = (await keyResponse.json()) as {
        publicKey?: unknown;
      };

      if (typeof publicKey !== "string" || !publicKey) {
        return "failed";
      }

      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queueId,
          queueEntryId,
          subscription: subscription.toJSON(),
        }),
      });

      return response.ok ? "ok" : "failed";
    } catch (error) {
      console.error("Push subscribe failed:", error);
      return "failed";
    }
  }, [queueId, queueEntryId]);

  /**
   * Initial probe after mount.
   *
   * Never prompts: it only reads the current permission. When permission
   * was already granted (the customer enabled notifications before), the
   * subscription is silently resynced so a returning ticket — or a
   * refreshed endpoint — starts working again without another click.
   */
  useEffect(() => {
    let cancelled = false;

    async function probe() {
      if (!isPushSupported()) {
        if (!cancelled) setPhase("unsupported");
        return;
      }

      if (Notification.permission === "granted") {
        if (readOptOut(queueId)) {
          if (!cancelled) setPhase("off");
          return;
        }

        const result = await subscribe();

        if (cancelled) return;
        setPhase(result === "ok" ? "on" : "off");
        return;
      }

      if (Notification.permission === "denied") {
        if (!cancelled) setPhase("denied");
        return;
      }

      if (!cancelled) setPhase("off");
    }

    void probe();

    return () => {
      cancelled = true;
    };
  }, [queueId, subscribe]);

  async function handleEnable() {
    setPhase("enabling");
    setMessage("");

    if (!isPushSupported()) {
      setPhase("unsupported");
      return;
    }

    // The one and only permission prompt — driven by this click.
    const permission = await Notification.requestPermission();

    if (permission === "denied") {
      // Best-effort server cleanup in case a stale record exists.
      await removeServerRecord();
      setPhase("denied");
      return;
    }

    if (permission !== "granted") {
      // Dismissed: not a denial, the button stays available.
      setPhase("off");
      return;
    }

    writeOptOut(queueId, false);

    const result = await subscribe();

    if (result === "ok") {
      setPhase("on");
      return;
    }

    if (result === "unconfigured") {
      setMessage("Notifications aren't available right now.");
    } else {
      setMessage("Something went wrong. Please try again.");
    }

    setPhase("error");
  }

  async function handleDisable() {
    setPhase("enabling");

    // Record the intent first: even if the network call fails, this
    // ticket should stop offering notifications on this device.
    writeOptOut(queueId, true);

    await removeServerRecord();

    // The browser subscription itself is left intact — it is shared by
    // this browser's other tickets, which keep their own records.
    setPhase("off");
  }

  /** Removes only this ticket's record; scoped by endpoint, best-effort. */
  async function removeServerRecord() {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      if (!subscription) {
        return;
      }

      await fetch("/api/notifications/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queueId,
          queueEntryId,
          subscription: subscription.toJSON(),
        }),
      });
    } catch (error) {
      console.error("Push unsubscribe failed:", error);
    }
  }

  if (phase === "unsupported") {
    // Unsupported browser (or no service worker): no affordance at all —
    // nothing to click and no permission prompt to accidentally trigger.
    return null;
  }

  if (phase === "checking") {
    // Same footprint as the opt-in card so nothing jumps when the probe
    // resolves; hidden from assistive tech because it carries no content.
    return (
      <div className="mt-4 w-full max-w-md" aria-hidden="true">
        <div className="h-[76px] animate-pulse rounded-2xl border border-qzc-rule bg-white/60" />
      </div>
    );
  }

  if (phase === "denied") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="mt-4 w-full max-w-md rounded-2xl border border-qzc-rule bg-white/70 px-4 py-4 sm:px-5"
      >
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-qzc-ink-3">
          Notifications
        </p>
        <p className="mt-2 text-[13px] leading-6 text-qzc-ink-2">
          Notifications are blocked for this site. You can allow them in your
          browser&rsquo;s site settings to get alerted when it&rsquo;s your
          turn.
        </p>
      </motion.div>
    );
  }

  if (phase === "on") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="mt-4 flex w-full max-w-md items-center justify-between gap-3 rounded-2xl border border-qz-accent/45 bg-qz-accent/10 px-4 py-3.5 sm:px-5"
      >
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-qz-accent"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold leading-tight text-qzen-brand-strong">
              Notifications are on
            </p>
            <p className="mt-0.5 text-[12.5px] leading-5 text-qzc-ink-2">
              We&rsquo;ll alert this device when your token is called.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDisable}
          className="shrink-0 rounded-full border border-qzc-rule-strong bg-white px-3.5 py-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-qzc-ink-2 transition hover:border-qzc-ink-3 hover:text-qzc-ink"
        >
          Turn off
        </button>
      </motion.div>
    );
  }

  // off / enabling / error
  const busy = phase === "enabling";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="mt-4 w-full max-w-md rounded-2xl border border-qzc-rule bg-white/70 px-4 py-4 sm:px-5"
    >
      <div className="flex items-start gap-2.5">
        <span
          className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-qzc-rule-strong"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold leading-tight text-qzc-ink">
            Get notified when it&rsquo;s your turn
          </p>
          <p className="mt-0.5 text-[12.5px] leading-5 text-qzc-ink-2">
            We&rsquo;ll alert this device the moment your token is called.
          </p>
        </div>
      </div>

      {phase === "error" && message ? (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] leading-5 text-red-700"
        >
          {message}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleEnable}
        disabled={busy}
        className="mt-3.5 inline-flex h-9 w-full items-center justify-center rounded-xl bg-qz-accent px-4 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-qz-accent-ink transition hover:bg-qz-accent-strong active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy
          ? "Enabling…"
          : phase === "error"
            ? "Try again"
            : "Enable Notifications"}
      </button>
    </motion.div>
  );
}

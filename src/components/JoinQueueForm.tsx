"use client";

import { FormEvent, useEffect, useState } from "react";
import { io } from "socket.io-client";

interface JoinQueueFormProps {
  queueId: string;
  queueStatus: string;
}

export default function JoinQueueForm({
  queueId,
  queueStatus,
}: JoinQueueFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [entryId, setEntryId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem(`qzen-ticket-${queueId}`);
  });
  const [tokenNumber, setTokenNumber] = useState<number | null>(null);

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
      setLoading(true);

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

      localStorage.setItem(`qzen-ticket-${queueId}`, newEntryId);

      setEntryId(newEntryId);
      setTokenNumber(newToken);
    } catch (error) {
      console.error("Join queue error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (entryId !== null && tokenNumber !== null) {
    if (customerStatus === "skipped") {
      return (
        <div className="mt-8 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-400">
            Your ticket
          </p>

          <p className="mt-6 text-sm text-zinc-500">Your token</p>

          <p className="mt-2 text-7xl font-bold tracking-tight text-zinc-900">
            #{tokenNumber}
          </p>

          <div className="mt-10 rounded-2xl bg-amber-50 p-6">
            <p className="text-lg font-semibold text-zinc-900">
              Your turn was skipped.
            </p>

            <p className="mt-2 text-sm text-zinc-600">
              Please contact the staff if you believe this was a mistake.
            </p>
          </div>
        </div>
      );
    }

    if (customerStatus === "completed") {
      return (
        <div className="mt-8 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-400">
            Visit complete
          </p>

          <p className="mt-6 text-sm text-zinc-500">Your token</p>

          <p className="mt-2 text-7xl font-bold tracking-tight text-zinc-900">
            #{tokenNumber}
          </p>

          <div className="mt-10 rounded-2xl bg-zinc-50 p-6">
            <p className="text-lg font-semibold text-zinc-900">
              Your visit is complete.
            </p>

            <p className="mt-2 text-sm text-zinc-600">
              Thank you for using Qzen.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-8 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-zinc-400">
          You&apos;re in!
        </p>

        <p className="mt-6 text-sm text-zinc-500">Your token</p>

        <p className="mt-2 text-7xl font-bold tracking-tight text-zinc-900">
          #{tokenNumber}
        </p>

        <div className="mt-10 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-zinc-50 p-5">
            <p className="text-sm text-zinc-500">Now serving</p>

            <p className="mt-2 text-2xl font-bold text-zinc-900">
              {currentToken !== null ? `#${currentToken}` : "..."}
            </p>
          </div>

          <div className="rounded-2xl bg-zinc-50 p-5">
            <p className="text-sm text-zinc-500">People ahead</p>

            <p className="mt-2 text-2xl font-bold text-zinc-900">
              {peopleAhead !== null ? peopleAhead : "..."}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-zinc-50 p-5">
          <p className="text-sm text-zinc-500">Estimated wait</p>

          <p className="mt-2 text-2xl font-bold text-zinc-900">
            {estimatedWait !== null ? `${estimatedWait} min` : "..."}
          </p>
        </div>

        <p className="mt-8 text-zinc-600">
          {customerStatus === "serving"
            ? "It's your turn!"
            : "You can relax while you wait."}
        </p>
      </div>
    );
  }

  if (currentQueueStatus === "paused") {
    return (
      <div className="mt-8 rounded-2xl bg-amber-50 p-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
          Queue Paused
        </p>

        <p className="mt-3 text-lg font-semibold text-zinc-900">
          This queue is temporarily paused.
        </p>

        <p className="mt-2 text-sm text-zinc-600">
          New customers cannot join right now. Please try again later.
        </p>
      </div>
    );
  }

  if (currentQueueStatus === "closed") {
    return (
      <div className="mt-8 rounded-2xl bg-red-50 p-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-red-600">
          Queue Closed
        </p>

        <p className="mt-3 text-lg font-semibold text-zinc-900">
          This queue is currently closed.
        </p>

        <p className="mt-2 text-sm text-zinc-600">
          New customers cannot join this queue right now.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label
          htmlFor="customerName"
          className="text-sm font-medium text-zinc-700"
        >
          Your name
        </label>

        <input
          id="customerName"
          type="text"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          placeholder="Enter your name"
          className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-900"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-black px-6 py-3 font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Joining..." : "Join Queue"}
      </button>
    </form>
  );
}

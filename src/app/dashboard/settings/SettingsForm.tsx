"use client";

import { FormEvent, useState } from "react";

interface SettingsFormProps {
  businessName: string;
  businessSlug: string;
  timezone: string;
  timezones: string[];
  email: string;
}

export default function SettingsForm({
  businessName,
  businessSlug,
  timezone,
  timezones,
  email,
}: SettingsFormProps) {
  const [name, setName] = useState(businessName);
  const [selectedTimezone, setSelectedTimezone] = useState(timezone);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/businesses", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          timezone: selectedTimezone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update settings.");
        return;
      }

      setMessage("Settings saved successfully.");
    } catch (error) {
      console.error("Update business error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      {/* Business Settings */}
      <div className="rounded-2xl border border-qz-line bg-qz-surface">
        <div className="border-b border-qz-line p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-qz-text">
            Business Settings
          </h2>

          <p className="mt-1 text-sm text-qz-text-2">
            Manage the information used across your Qzen workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
          <div className="max-w-2xl space-y-6">
            {/* Business Name */}
            <div>
              <label
                htmlFor="businessName"
                className="text-sm font-medium text-qz-text"
              >
                Business name
              </label>

              <p className="mt-1 text-xs text-qz-text-2">
                This is how your business appears throughout Qzen.
              </p>

              <input
                id="businessName"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="mt-3 h-11 w-full rounded-xl border border-qz-line-strong bg-qz-surface-2 px-3.5 text-sm text-qz-text outline-none transition placeholder:text-qz-text-3 focus:border-qz-accent focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* Business Slug */}
            <div>
              <label
                htmlFor="businessSlug"
                className="text-sm font-medium text-qz-text"
              >
                Business slug
              </label>

              <p className="mt-1 text-xs text-qz-text-2">
                Your public business identifier.
              </p>

              <div className="mt-3 flex h-11 items-center rounded-xl border border-qz-line bg-qz-surface-2 px-3.5 text-sm text-qz-text-2">
                /{businessSlug}
              </div>

              <p className="mt-2 text-xs text-qz-text-3">
                Your business slug cannot be changed because existing QR codes
                may use this address.
              </p>
            </div>

            {/* Timezone */}
            <div>
              <label
                htmlFor="timezone"
                className="text-sm font-medium text-qz-text"
              >
                Timezone
              </label>

              <p className="mt-1 text-xs text-qz-text-2">
                Used for queue activity, analytics, and daily session
                calculations.
              </p>

              <select
                id="timezone"
                value={selectedTimezone}
                onChange={(event) => setSelectedTimezone(event.target.value)}
                className="mt-3 h-11 w-full rounded-xl border border-qz-line-strong bg-qz-surface-2 px-3.5 text-sm text-qz-text outline-none transition focus:border-qz-accent focus:ring-2 focus:ring-emerald-500/30"
              >
                {timezones.map((timezoneOption) => (
                  <option key={timezoneOption} value={timezoneOption}>
                    {timezoneOption}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-6 max-w-2xl rounded-xl border border-red-500/30 bg-red-500/12 px-4 py-3 text-sm text-red-400"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              role="status"
              className="mt-6 max-w-2xl rounded-xl border border-emerald-500/30 bg-qz-accent-soft px-4 py-3 text-sm text-emerald-300"
            >
              {message}
            </div>
          )}

          <div className="mt-6">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-qz-accent px-5 py-2.5 text-sm font-semibold text-qz-accent-ink transition hover:bg-qz-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Account */}
      <div className="rounded-2xl border border-qz-line bg-qz-surface">
        <div className="border-b border-qz-line p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-qz-text">Account</h2>

          <p className="mt-1 text-sm text-qz-text-2">
            Your Qzen account information.
          </p>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <p className="text-xs font-medium text-qz-text-3">Email</p>

            <p className="mt-1 text-sm font-medium text-qz-text">{email}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-qz-text-3">Account type</p>

            <p className="mt-1 text-sm font-medium text-qz-text">
              Business Owner
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

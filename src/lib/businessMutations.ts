import { connectDB } from "@/lib/db";
import { QueueOperationError } from "@/lib/queueMutations";
import Business from "@/models/Business";

/**
 * Timezones a business may be set to.
 *
 * This list used to live inside `PATCH /api/businesses`; it now sits with the
 * update itself so the HTTP route and the MCP `update_business_settings` tool
 * always validate against the same values.
 */
const SUPPORTED_TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
];

/**
 * Updates the settings the dashboard already exposes for a business: its name
 * and its timezone.
 *
 * This is the single implementation behind `PATCH /api/businesses` and the MCP
 * `update_business_settings` tool — the MCP layer only forwards inputs, so
 * Qzen's validation and ordering are never re-implemented there. The business
 * is always resolved through `ownerId`, so a caller can only ever edit the
 * business they own, exactly like `getBusinessByOwner`.
 *
 * `slug` is deliberately not part of `input` and is never read: it is the
 * public join URL and the QR code target, so it stays read-only the same way a
 * queue's slug does.
 *
 * The failures are `QueueOperationError`, Qzen's shared "expected
 * business-rule failure" type: the messages are the ones the HTTP API already
 * returns for these conditions, so both the route and MCP's `handleToolError`
 * can surface them verbatim.
 */
export async function updateBusinessSettingsForOwner(
  ownerId: string,
  input: { name?: unknown; timezone?: unknown },
) {
  await connectDB();

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const timezone =
    typeof input.timezone === "string" ? input.timezone.trim() : "";

  if (!name) {
    throw new QueueOperationError("Business name is required.");
  }

  if (!timezone) {
    throw new QueueOperationError("Timezone is required.");
  }

  if (!SUPPORTED_TIMEZONES.includes(timezone)) {
    throw new QueueOperationError("Invalid timezone.");
  }

  const business = await Business.findOneAndUpdate(
    {
      ownerId,
    },
    {
      $set: {
        name,
        timezone,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  ).lean();

  if (!business) {
    throw new QueueOperationError("Business not found.", 404);
  }

  return { business };
}

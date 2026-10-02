/*
 * Qzen service worker — push delivery only.
 *
 * Deliberately tiny and free of application logic: it renders the payload
 * the server sends (title/body/url) and handles the click by focusing an
 * existing Qzen window or opening the customer status page.
 */

self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    // Non-JSON payload: fall back to raw text so something still shows.
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = typeof payload.title === "string" && payload.title
    ? payload.title
    : "Qzen";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof payload.body === "string" ? payload.body : "",
      tag: typeof payload.tag === "string" ? payload.tag : undefined,
      data: {
        url: typeof payload.url === "string" ? payload.url : "/",
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Prefer an already-open Qzen tab: focus it when it is on the
      // target page, otherwise navigate it there and focus it.
      for (const client of clients) {
        if (client.url === targetUrl) {
          return client.focus();
        }
      }

      if (clients.length > 0) {
        const client = clients[0];

        try {
          await client.navigate(targetUrl);
        } catch {
          // Navigation can fail cross-origin or if the client is closing;
          // focusing still beats opening a duplicate tab.
        }

        return client.focus();
      }

      return self.clients.openWindow(targetUrl);
    })(),
  );
});

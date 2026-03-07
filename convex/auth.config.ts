export default {
  providers: [
    {
      // The domain here must match the `iss` (issuer) field of the auth token.
      // If CONVEX_SITE_URL is set (e.g. at https://backend.wakulima.online), use that.
      domain: process.env.CONVEX_SITE_URL || "http://localhost:8080",
      applicationID: "convex",
    },
  ],
};

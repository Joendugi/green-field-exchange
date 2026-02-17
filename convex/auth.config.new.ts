export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL || "http://localhost:8080",
      applicationID: "convex",
    },
  ],
};

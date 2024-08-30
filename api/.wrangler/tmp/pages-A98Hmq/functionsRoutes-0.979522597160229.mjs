import { onRequest as __trpc___trpc___js_onRequest } from "/Users/michael/dev/cfp-stack/api/functions/trpc/[[trpc]].js"

export const routes = [
    {
      routePath: "/trpc/:trpc*",
      mountPath: "/trpc",
      method: "",
      middlewares: [],
      modules: [__trpc___trpc___js_onRequest],
    },
  ]
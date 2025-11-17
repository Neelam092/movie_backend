// Small helper to register route metadata for code-first OpenAPI generation
// Modules/controllers can call registerRoute(app, meta) where meta is:
// { path, method, parameters, requestBody, responses, security }

export function registerRoute(app, meta = {}) {
  if (!app) return;
  app._routeMeta = app._routeMeta || [];
  app._routeMeta.push(meta);
}

export function getRouteMeta(app) {
  return (app && app._routeMeta) || [];
}

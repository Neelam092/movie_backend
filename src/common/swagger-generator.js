// Very small code-first OpenAPI generator that inspects express routes.
// Produces a minimal OpenAPI object suitable for swagger-ui.
//
// Note: Express nests routes inside Router objects. Older/simple generators
// only look at top-level stack and therefore miss routes added via
// `app.use(router)`; this implementation recursively traverses router stacks
// and attempts to derive a readable path prefix when routers are mounted.

function addPath(paths, routePath, method) {
  // Normalize Express-style :param to OpenAPI {param}
  const openApiPath = routePath.replace(/:(\w+)/g, '{$1}');
  if (!paths[openApiPath]) paths[openApiPath] = {};
  paths[openApiPath][method] = {
    summary: 'Auto-generated route',
    responses: {
      '200': {
        description: 'OK',
        content: { 'application/json': { schema: { type: 'object' } } },
      },
    },
  };
}

function extractMountPath(layer) {
  // If the layer is the fast slash (mounted at '/'), keep empty prefix
  if (layer.regexp && layer.regexp.fast_slash) return '';
  if (!layer.regexp) return '';
  // Try to convert the regexp source to a readable path fragment.
  // This is heuristic but works for common mounting like /^\/movies\/?(?=\/|$)/i
  try {
    let src = layer.regexp.source;
    // remove typical regex suffixes we don't want
    src = src.replace('(?=\\/|$)', '');
    src = src.replace('\\/?', '');
    src = src.replace('^', '').replace('$', '');
    // turn escaped slashes into normal slashes
    src = src.replace(/\\\//g, '/');
    return src;
  } catch (e) {
    return '';
  }
}

export function generateOpenApi(app, { title = 'API (auto)', version = '1.0.0' } = {}) {
  const paths = {};
  const stack = app._router && app._router.stack ? app._router.stack : [];

  function traverse(stack, prefix = '') {
    for (const layer of stack) {
      // direct route
      if (layer.route && layer.route.path) {
        const routePath = prefix + layer.route.path;
        const methods = layer.route.methods || {};
        // detect if any middleware on this route looks like an auth guard
        let hasAuth = false;
        try {
          const routeStack = layer.route.stack || [];
          for (const item of routeStack) {
            const fn = item.handle || item;
            const name = fn && fn.name ? fn.name : '';
            if (name === 'JwtGuard' || name.toLowerCase().includes('auth') || name.toLowerCase().includes('guard')) {
              hasAuth = true;
              break;
            }
          }
        } catch (e) {
          // ignore
        }
        for (const [method, enabled] of Object.entries(methods)) {
          if (!enabled) continue;
          addPath(paths, routePath, method);
          if (hasAuth) {
            paths[routePath][method].security = [{ bearerAuth: [] }];
          }
        }
        continue;
      }

      // mounted router: recurse into its stack
      if (layer.name === 'router' && layer.handle && layer.handle.stack) {
        const mount = extractMountPath(layer) || '';
        traverse(layer.handle.stack, prefix + mount);
        continue;
      }

      // some layers might directly contain a handle with stack (safety)
      if (layer.handle && layer.handle.stack) {
        traverse(layer.handle.stack, prefix);
      }
    }
  }

  traverse(stack, '');

  // Merge any registered route metadata if present (parameters, requestBody, responses, security)
  const meta = (app && app._routeMeta) || [];
  for (const m of meta) {
    const rawPath = m.path || '/';
    const method = (m.method || 'get').toLowerCase();

    // Try to find an existing generated path that matches this meta path.
    // Support both OpenAPI-style {id} and Express-style :id in metadata.
    const variants = new Set();
    variants.add(rawPath);
    // convert {id} -> :id
    variants.add(rawPath.replace(/{(\w+)}/g, ':$1'));
    // convert :id -> {id}
    variants.add(rawPath.replace(/:(\w+)/g, '{$1}'));

    // find existing path key in generated paths that matches any variant
    let matched = null;
    for (const v of variants) {
      if (paths[v]) {
        matched = v;
        break;
      }
    }

    const targetPath = matched || rawPath;
    paths[targetPath] = paths[targetPath] || {};
    paths[targetPath][method] = paths[targetPath][method] || { summary: m.summary || 'Auto-generated route', responses: { '200': { description: 'OK' } } };
    // attach parameters, requestBody, responses, security if provided
    if (m.parameters) paths[targetPath][method].parameters = m.parameters;
    if (m.requestBody) paths[targetPath][method].requestBody = m.requestBody;
    if (m.responses) paths[targetPath][method].responses = Object.assign(paths[targetPath][method].responses || {}, m.responses);
    if (m.security) paths[targetPath][method].security = m.security;
  }

  // Auto-attach response schemas based on simple heuristics when not provided by metadata
  for (const [p, methods] of Object.entries(paths)) {
    for (const [mtd, op] of Object.entries(methods)) {
      op.responses = op.responses || {};
      // helper to set response if not already present
      const setResponseIfMissing = (status, schemaRef) => {
        if (!op.responses[status] || !op.responses[status].content) {
          op.responses[status] = { description: 'OK', content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaRef}` } } } };
        }
      };

      const lowerPath = p.toLowerCase();
      // /movies -> list
      if (lowerPath === '/movies' && mtd === 'get') setResponseIfMissing('200', 'PaginatedMovies');
      // create movie
      if (lowerPath === '/movies' && mtd === 'post') setResponseIfMissing('201', 'Movie');
      // single movie operations
      if (lowerPath.startsWith('/movies/') && lowerPath.match(/\/movies\/\{?\w+\}?/)) {
        if (mtd === 'get') setResponseIfMissing('200', 'Movie');
        if (mtd === 'put') setResponseIfMissing('200', 'Movie');
        if (mtd === 'delete') setResponseIfMissing('200', 'Movie');
      }
      // auth login
      if (lowerPath === '/auth/login' && mtd === 'post') setResponseIfMissing('200', 'AuthResponse');
    }
  }

  // Ensure operations that require bearerAuth also show an Authorization header parameter
  for (const [p, methods] of Object.entries(paths)) {
    for (const [mtd, op] of Object.entries(methods)) {
      const hasBearer = Array.isArray(op.security) && op.security.some(s => s && s.bearerAuth !== undefined);
      if (!hasBearer) continue;
      op.parameters = op.parameters || [];
      const hasAuthHeader = op.parameters.some(pr => pr.in === 'header' && pr.name && pr.name.toLowerCase() === 'authorization');
      if (!hasAuthHeader) {
        op.parameters.unshift({ in: 'header', name: 'Authorization', required: true, schema: { type: 'string' }, description: 'Bearer <token>' });
      }
    }
  }

  return {
    openapi: '3.0.0',
    info: { title, version },
    paths,
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Movie: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            publishingYear: { type: 'integer' },
            poster: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        PaginatedMovies: {
          type: 'object',
          properties: {
            items: { type: 'array', items: { $ref: '#/components/schemas/Movie' } },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: { access_token: { type: 'string' } },
        },
      },
    },
  };
}

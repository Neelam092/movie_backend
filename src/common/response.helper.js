// Small response helpers to standardize API responses across controllers
// Generic send function: pass success (boolean), message, data and status
export function sendResponse(res, { success = true, message = 'OK', data = null, status = 200 } = {}) {
  return res.status(status).json({ success, message, data });
}

// Convenience helpers
export function sendSuccess(res, message = 'OK', data = null, status = 200) {
  return sendResponse(res, { success: true, message, data, status });
}

export function sendError(res, message = 'Error', status = 500, data = null) {
  return sendResponse(res, { success: false, message, data, status });
}

export function sendDeleted(res, resourceName = 'Resource', deleted = null, status = 200) {
  const message = `${resourceName} deleted`;
  return sendSuccess(res, message, deleted, status);
}

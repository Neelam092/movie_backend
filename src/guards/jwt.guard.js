import { verifyToken } from '../strategies/jwt.strategy.js';
import { sendResponse } from '../common/response.helper.js';

// Express middleware as guard to protect routes
export function JwtGuard(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return sendResponse(res, { success: false, message: 'Unauthorized', data: null, status: 401 });
  }
  const token = auth.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) return sendResponse(res, { success: false, message: 'Invalid token', data: null, status: 401 });
  req.user = payload;
  return next();
}

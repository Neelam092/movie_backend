
// A global HTTP exception filter that returns consistent { success, message, data } responses

import { sendResponse } from '../response.helper.js';

export class HttpExceptionFilter {
  catch(exception, req, res, next) {
    // If it's an express error with status, use it; otherwise 500
    const status = exception && exception.status ? exception.status : 500;
    const message = exception && exception.message ? exception.message : 'Internal server error';

    // Use centralized response helper for errors
    return sendResponse(res, { success: false, message, data: null, status });
  }
}

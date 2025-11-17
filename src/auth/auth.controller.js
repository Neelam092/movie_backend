export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  // POST /auth/login
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const tokens = await this.authService.login(email, password);
      // Use common response helper
      const { sendSuccess } = await import('../common/response.helper.js');
      return sendSuccess(res, 'Logged in', tokens);
    } catch (err) {
      return next(err);
    }
  }
}

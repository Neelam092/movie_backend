import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { registerRoute } from '../common/swagger-meta.js';

export function authModule(app, container) {
  const router = Router();
  // Resolve service from container if available, otherwise create a new one
  const service = (container && container.resolve('AuthService')) || new AuthService();
  const controller = new AuthController(service);

  router.post('/auth/login', controller.login.bind(controller));
  // Register metadata for code-first docs
  registerRoute(app, {
    path: '/auth/login',
    method: 'post',
    summary: 'Login and obtain JWT',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { email: { type: 'string' }, password: { type: 'string' } },
          },
        },
      },
    },
    responses: {
      '200': { description: 'OK' },
    },
  });

  app.use(router);
}

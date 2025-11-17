import express from 'express';
import { authModule } from './auth/auth.module.js';
import { moviesModule } from './movies/movies.module.js';
import { sendSuccess } from './common/response.helper.js';
import { Container } from './common/container.js';
import { AuthService } from './auth/auth.service.js';
import { MoviesService } from './movies/movies.service.js';

// Compose modules by registering their routers on the app
export function appModule(app) {
  // Create DI container and register providers
  const container = new Container();
  container.register('AuthService', () => new AuthService());
  container.register('MoviesService', () => new MoviesService());

  // Mount auth routes (modules now receive the container)
  authModule(app, container);

  // Mount movie routes
  moviesModule(app, container);

  // Health check
  app.get('/health', (req, res) => sendSuccess(res, 'OK', null));
}

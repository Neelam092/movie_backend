import { Router } from 'express';
import { MoviesController } from './movies.controller.js';
import { MoviesService } from './movies.service.js';
import { upload } from '../uploads/multer.config.js';
import { JwtGuard } from '../guards/jwt.guard.js';
import { registerRoute } from '../common/swagger-meta.js';

export function moviesModule(app, container) {
  const router = Router();
  const service = (container && container.resolve('MoviesService')) || new MoviesService();
  const controller = new MoviesController(service);

  // Public list and get
  router.get('/movies', controller.list.bind(controller));
  // register metadata for list
  registerRoute(app, {
    path: '/movies',
    method: 'get',
    summary: 'List movies with filters',
    parameters: [
      { in: 'query', name: 'search', schema: { type: 'string' } },
      { in: 'query', name: 'title', schema: { type: 'string' } },
      { in: 'query', name: 'publishingYear', schema: { type: 'string' } },
      { in: 'query', name: 'publishingYear_min', schema: { type: 'integer' } },
      { in: 'query', name: 'publishingYear_max', schema: { type: 'integer' } },
      { in: 'query', name: 'createdAfter', schema: { type: 'string', format: 'date-time' } },
      { in: 'query', name: 'createdBefore', schema: { type: 'string', format: 'date-time' } },
      { in: 'query', name: 'sort', schema: { type: 'string' } },
      { in: 'query', name: 'page', schema: { type: 'integer' } },
      { in: 'query', name: 'limit', schema: { type: 'integer' } },
    ],
  });
  router.get('/movies/:id', controller.getById.bind(controller));
  registerRoute(app, { path: '/movies/:id', method: 'get', summary: 'Get movie by id', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }] });

  // Protected routes for create/update/delete
  router.post('/movies', JwtGuard, upload.single('poster'), controller.create.bind(controller));
  registerRoute(app, {
    path: '/movies',
    method: 'post',
    summary: 'Create a movie',
    parameters: [
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' }, description: 'Bearer <token>' },
    ],
    requestBody: {
      required: true,
      content: { 'multipart/form-data': { schema: { type: 'object', properties: { title: { type: 'string' }, publishingYear: { type: 'integer' }, poster: { type: 'string', format: 'binary' } } } } },
    },
    security: [{ bearerAuth: [] }],
  });
  router.put('/movies/:id', JwtGuard, upload.single('poster'), controller.update.bind(controller));
  registerRoute(app, {
    path: '/movies/:id',
    method: 'put',
    summary: 'Update a movie',
    parameters: [
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' }, description: 'Bearer <token>' },
      { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
    ],
    requestBody: {
      required: true,
      content: { 'multipart/form-data': { schema: { type: 'object', properties: { title: { type: 'string' }, publishingYear: { type: 'integer' }, poster: { type: 'string', format: 'binary' } } } } },
    },
    security: [{ bearerAuth: [] }],
  });
  router.delete('/movies/:id', JwtGuard, controller.remove.bind(controller));
  registerRoute(app, {
    path: '/movies/:id',
    method: 'delete',
    summary: 'Delete a movie',
    parameters: [
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' }, description: 'Bearer <token>' },
      { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
    ],
    security: [{ bearerAuth: [] }],
  });

  app.use(router);
}

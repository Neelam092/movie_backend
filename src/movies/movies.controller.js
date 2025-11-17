import { join } from 'path';
import { sendDeleted, sendSuccess, sendResponse } from '../common/response.helper.js';

// Validation schemas removed by user request; validation middleware is a no-op.

export class MoviesController {
  constructor(service) {
    this.service = service;
    this.HOST = process.env.mode === 'dev' ? process.env.HOST : process.env.LIVEhOST;
  }

  // GET /movies?page=&limit=
  async list(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      // Build flexible filters from query params
      const filters = {};
    if (req.query.title) filters.title = req.query.title;
    // Use `search` query param (maps to the service `search` quick-search behavior)
    if (req.query.search) filters.search = req.query.search;
      if (req.query.publishingYear) filters.publishingYear = req.query.publishingYear;
      if (req.query.publishingYear_min) filters.publishingYear_min = req.query.publishingYear_min;
      if (req.query.publishingYear_max) filters.publishingYear_max = req.query.publishingYear_max;
      if (req.query.createdAfter) filters.createdAfter = req.query.createdAfter;
      if (req.query.createdBefore) filters.createdBefore = req.query.createdBefore;
      // Allow raw JSON filter via ?raw={...} (URL-encoded)
      if (req.query.raw) {
        try {
          filters.raw = JSON.parse(req.query.raw);
        } catch (e) {
          // ignore invalid raw filter
        }
      }

      // Parse sort param like "createdAt:desc,title:asc"
      let sort = { createdAt: -1 };
      if (req.query.sort) {
        sort = {};
        const parts = String(req.query.sort).split(',');
        for (const p of parts) {
          const [field, dir] = p.split(':').map((s) => s.trim());
          if (!field) continue;
          sort[field] = dir && dir.toLowerCase() === 'asc' ? 1 : -1;
        }
      }

  const result = await this.service.findAll({ page, limit, filters, sort });
  return sendSuccess(res, 'Movies retrieved', result);
    } catch (err) {
      return next(err);
    }
  }

  // GET /movies/:id
  async getById(req, res, next) {
    try {
      const movie = await this.service.findById(req.params.id);
  if (!movie) return sendResponse(res, { success: false, message: 'Not found', data: null, status: 404 });
  return sendSuccess(res, 'Movie found', movie);
    } catch (err) {
      return next(err);
    }
  }

// POST /movies (multipart/form-data)
async create(req, res, next) {
  try {
    const { title, publishingYear } = req.body;

    // ---------------------------
    // 🔍 Manual Input Validation
    // ---------------------------
    const errors = [];

    if (!title || typeof title !== 'string' || title.trim().length < 2) {
      errors.push("Title is required and must be at least 2 characters.");
    }

    const year = Number(publishingYear);
    const currentYear = new Date().getFullYear();

    if (!publishingYear || isNaN(year) || year < 1900 || year > currentYear) {
      errors.push(`Publishing year must be a number between 1900 and ${currentYear}.`);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      });
    }

    // ---------------------------
    // 🔍 Validate poster (optional)
    // ---------------------------
    let posterPath = null;
    if (req.file?.filename) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Poster must be an image (png, jpg, jpeg)."
        });
      }

      posterPath = `${this.HOST}/uploads/${req.file.filename}`;
    }

    // ---------------------------
    // 📌 Create Movie
    // ---------------------------
    const movie = await this.service.create({
      title: title.trim(),
      publishingYear: year,
      poster: posterPath
    });

    return sendSuccess(res, 'Movie created', movie, 201);

  } catch (err) {
    next(err);
  }
}


  // PUT /movies/:id (multipart/form-data)
  async update(req, res, next) {
    try {
      const { title, publishingYear } = req.body;
      let posterPath = null;
      if (req.file && req.file.filename) {
        posterPath = `${this.HOST}/uploads/${req.file.filename}`;
      }
  const updated = await this.service.update(req.params.id, { title, publishingYear, poster: posterPath });
  if (!updated) return sendResponse(res, { success: false, message: 'Not found', data: null, status: 404 });
  return sendSuccess(res, 'Movie updated', updated);
    } catch (err) {
      return next(err);
    }
  }

  // DELETE /movies/:id
  async remove(req, res, next) {
    try {
  const deleted = await this.service.remove(req.params.id);
  if (!deleted) return sendResponse(res, { success: false, message: 'Not found', data: null, status: 404 });
  // Return the deleted movie document for client-side convenience
  return sendSuccess(res, 'Movie deleted', deleted , 200);
    } catch (err) {
      return next(err);
    }
  }
}

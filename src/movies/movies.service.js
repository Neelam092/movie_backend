import { Movie } from './movies.model.js';
import { GenericRepository } from '../common/db.service.js';

const repo = new GenericRepository(Movie);

export class MoviesService {
  async create({ title, publishingYear, poster }) {
    return repo.create({ title, publishingYear, poster });
  }
    // More flexible findAll that accepts filter and sort options.
    // options: { page, limit, filters, sort }
    async findAll({ page = 1, limit = 10, filters = {}, sort = { createdAt: -1 } } = {}) {
    // Build mongoose-friendly filter
    const mongoFilter = {};

    // Title partial, case-insensitive
    if (filters.title) {
      mongoFilter.title = { $regex: filters.title, $options: 'i' };
    }

    // Quick q search across title (and publishingYear as text)
    if (filters.search) {
      const q = String(filters.search).trim();
      if (q) {
        const yearNum = parseInt(q, 10);
        const or = [{ title: { $regex: q, $options: 'i' } }];
        if (!Number.isNaN(yearNum)) {
          or.push({ publishingYear: yearNum });
        }
        mongoFilter.$or = or;
      }
    }

    // publishingYear exact or range
    if (filters.publishingYear) {
      // allow comma or dash range like 1990-2000 or a single year
      const val = String(filters.publishingYear);
      if (val.includes('-')) {
        const [min, max] = val.split('-').map((v) => parseInt(v, 10));
        mongoFilter.publishingYear = {};
        if (!Number.isNaN(min)) mongoFilter.publishingYear.$gte = min;
        if (!Number.isNaN(max)) mongoFilter.publishingYear.$lte = max;
      } else {
        const num = parseInt(val, 10);
        if (!Number.isNaN(num)) mongoFilter.publishingYear = num;
      }
    }

    if (filters.publishingYear_min || filters.publishingYear_max) {
      mongoFilter.publishingYear = mongoFilter.publishingYear || {};
      const min = parseInt(filters.publishingYear_min, 10);
      const max = parseInt(filters.publishingYear_max, 10);
      if (!Number.isNaN(min)) mongoFilter.publishingYear.$gte = min;
      if (!Number.isNaN(max)) mongoFilter.publishingYear.$lte = max;
    }

    // createdAt range filters: createdAfter (>=), createdBefore (<=)
    if (filters.createdAfter || filters.createdBefore) {
      mongoFilter.createdAt = {};
      if (filters.createdAfter) {
        const d = new Date(filters.createdAfter);
        if (!isNaN(d)) mongoFilter.createdAt.$gte = d;
      }
      if (filters.createdBefore) {
        const d = new Date(filters.createdBefore);
        if (!isNaN(d)) mongoFilter.createdAt.$lte = d;
      }
    }

    // Merge any additional raw filters provided (allow advanced queries)
    if (filters.raw && typeof filters.raw === 'object') {
      Object.assign(mongoFilter, filters.raw);
    }

    return repo.find({ filter: mongoFilter, page, limit, sort });
  }

  async findById(id) {
    return repo.findById(id);
  }

  async update(id, { title, publishingYear, poster }) {
    const update = {};
    if (title !== undefined) update.title = title;
    if (publishingYear !== undefined) update.publishingYear = publishingYear;
    if (poster) update.poster = poster;
    return repo.updateById(id, update, { new: true });
  }

  async remove(id) {
    return repo.deleteById(id);
  }
}

// GenericRepository: small wrapper around a Mongoose model to provide common DB operations
// The methods accept a single object parameter where appropriate for clarity and flexibility.

export class GenericRepository {
  constructor(model) {
    this.model = model;
  }

  // Create a new document
  async create(data) {
    return this.model.create(data);
  }

  // Find documents with optional pagination, sorting and projection
  // params: { filter, page, limit, sort, projection }
  async find({ filter = {}, page = 1, limit = 10, sort = { createdAt: -1 }, projection = null } = {}) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.model.find(filter, projection).sort(sort).skip(skip).limit(limit).lean(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page, limit };
  }

  // Find single document by filter
  async findOne({ filter = {}, projection = null } = {}) {
    return this.model.findOne(filter, projection).lean();
  }

  // Find by ID
  async findById(id, projection = null) {
    return this.model.findById(id, projection).lean();
  }

  // Update by ID
  async updateById(id, update = {}, options = { new: true }) {
    return this.model.findByIdAndUpdate(id, update, options).lean();
  }

  // Update one by filter
  async updateOne({ filter = {}, update = {}, options = { new: true } } = {}) {
    return this.model.findOneAndUpdate(filter, update, options).lean();
  }

  // Delete by ID
  async deleteById(id) {
    return this.model.findByIdAndDelete(id).lean();
  }

  // Delete one by filter
  async deleteOne({ filter = {} } = {}) {
    return this.model.findOneAndDelete(filter).lean();
  }
}

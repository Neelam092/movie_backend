import mongoose from 'mongoose';

const { Schema } = mongoose;

const MovieSchema = new Schema({
  title: { type: String, required: true },
  publishingYear: { type: Number, required: true },
  poster: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

export const Movie = mongoose.model('Movie', MovieSchema);

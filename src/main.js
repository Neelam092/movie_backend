import express from 'express';
import morganPkg from 'morgan';
import bodyParserPkg from 'body-parser';
const morgan = typeof morganPkg === 'function' ? morganPkg : (morganPkg.default || morganPkg);
const { json, urlencoded } = bodyParserPkg;
import { join } from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import { createConnection } from './config/db.js';
import { appModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { generateOpenApi } from './common/swagger-generator.js';
import cors from 'cors';


// __dirname replacement for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Load environment variables from .env if present
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 5000;

// Create Express app (NestJS uses Express under the hood; we'll wire things similarly)
const app = express();

// Basic middlewares
app.use(morgan('dev'));
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cors())

// Serve uploads directory statically
const uploadsDir = process.env.UPLOAD_DIR || 'uploads';
const uploadsPath = join(process.cwd(), uploadsDir);
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
app.use(`/${uploadsDir}`, express.static(uploadsPath));

// Setup Swagger UI
try {
  const swaggerDocument = yaml.load(fs.readFileSync(join(process.cwd(), 'swagger.yaml'), 'utf8'));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  console.warn('Swagger file not found or invalid:', err.message);
}

// Setup code-first generated docs at /docs-code and /docs-code.json
// (code-first docs are mounted later after modules are registered)

// Global error handler (simple wrapper around HttpExceptionFilter)
app.use((err, req, res, next) => {
  const filter = new HttpExceptionFilter();
  return filter.catch(err, req, res, next);
});

// Connect to MongoDB
await createConnection();

// Initialize modules (they will add routes to the Express app)
appModule(app);

// Now that routes are registered, generate code-first OpenAPI and expose it
try {
  const autoSpec = generateOpenApi(app, { title: 'Movie API (auto-generated)', version: '1.0.0' });
  app.get('/docs-code.json', (req, res) => res.json(autoSpec));
  app.use('/docs-code', swaggerUi.serve, swaggerUi.setup(autoSpec));
} catch (err) {
  console.warn('Failed to generate code-first swagger:', err.message);
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/docs`);
});

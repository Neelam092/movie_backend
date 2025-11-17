import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// A simple auth service with a hardcoded admin user stored hashed
export class AuthService {
  constructor() {
    // Admin credentials are read from env; the password must be pre-hashed
    this.adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    this.adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || null; // bcrypt hash
  }

  async validateUser(email, password) {
    if (email !== this.adminEmail) return false;
    if (!this.adminPasswordHash) return false;
    const match = await bcrypt.compare(password, this.adminPasswordHash);
    return match;
  }

  async login(email, password) {
    const valid = await this.validateUser(email, password);
    if (!valid) throw { status: 401, message: 'Invalid credentials' };
    const payload = { sub: email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return { access_token: token };
  }
}

// Very small DI container for JS projects
// Usage:
//  const container = new Container();
//  container.register('MyService', () => new MyService());
//  const svc = container.resolve('MyService');

export class Container {
  constructor() {
    this.providers = new Map();
    this.cache = new Map();
  }

  // register a provider factory; factory will be called on first resolve
  register(name, factory) {
    if (typeof factory !== 'function') throw new Error('factory must be a function');
    this.providers.set(name, factory);
  }

  // resolve provider by name; caches the instance
  resolve(name) {
    if (this.cache.has(name)) return this.cache.get(name);
    if (!this.providers.has(name)) return null;
    const instance = this.providers.get(name)();
    this.cache.set(name, instance);
    return instance;
  }

  // convenience: has provider
  has(name) {
    return this.providers.has(name) || this.cache.has(name);
  }
}

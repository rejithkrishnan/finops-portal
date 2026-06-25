import { Express } from 'express';
import fs from 'fs';
import path from 'path';

interface Plugin {
  name: string;
  prefix: string;
  router: any;
}

/**
 * Plugin Registry — auto-discovers and loads plugins from the plugins/ directory.
 * Each plugin must export a default object with { name, prefix, router }.
 */
export async function registerPlugins(app: Express): Promise<void> {
  const pluginsDir = path.join(__dirname, 'plugins');

  if (!fs.existsSync(pluginsDir)) {
    console.warn('[PluginRegistry] No plugins directory found');
    return;
  }

  const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const indexPath = path.join(pluginsDir, entry.name, 'index');

    try {
      // Try to import the plugin
      const pluginModule = require(indexPath);
      const plugin: Plugin = pluginModule.default || pluginModule;

      if (plugin.name && plugin.router) {
        app.use(plugin.prefix || '/api', plugin.router);
        console.log(`[PluginRegistry] ✓ Loaded plugin: ${plugin.name} (${plugin.prefix})`);
      } else {
        console.warn(`[PluginRegistry] ⚠ Invalid plugin in ${entry.name}: missing name or router`);
      }
    } catch (error) {
      console.error(`[PluginRegistry] ✗ Failed to load plugin: ${entry.name}`, error);
    }
  }
}

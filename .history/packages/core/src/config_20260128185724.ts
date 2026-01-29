import { existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import type { RivetConfig } from './types'

export interface ConfigLoader {
  load(cwd: string): Promise<RivetConfig | null>
  findConfig(startDir: string): Promise<string | null>
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  engines: {},
  ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/build/**', '**/coverage/**'],
  include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
  severity: {
    minLevel: 'info' as const,
  },
  output: {
    format: 'console' as const,
    path: undefined,
  },
} as const

/**
 * Configuration file loader for RIVET
 * Supports rivet.config.js, rivet.config.mjs, rivet.config.cjs
 */
export class ConfigLoaderImpl implements ConfigLoader {
  private readonly configFiles = [
    'rivet.config.js',
    'rivet.config.mjs',
    'rivet.config.cjs',
    '.rivetrc.js',
  ]

  /**
   * Load configuration from a directory
   * Searches for config files and merges with defaults
   */
  async load(cwd: string): Promise<RivetConfig | null> {
    const configPath = await this.findConfig(cwd)
    if (!configPath) {
      return null
    }

    try {
      // Dynamic import to support ESM/CJS
      const imported = await import(configPath)
      const userConfig: RivetConfig = imported.default || imported

      return this.mergeConfig(userConfig)
    } catch (error) {
      console.error(`Failed to load config from ${configPath}:`, error)
      return null
    }
  }

  /**
   * Find the nearest configuration file by walking up the directory tree
   */
  async findConfig(startDir: string): Promise<string | null> {
    let currentDir = resolve(startDir)
    const rootDir = resolve('/')

    while (currentDir !== rootDir) {
      for (const configFile of this.configFiles) {
        const configPath = resolve(currentDir, configFile)
        if (existsSync(configPath)) {
          return configPath
        }
      }

      // Move up one directory
      const parentDir = dirname(currentDir)
      if (parentDir === currentDir) break // Reached root
      currentDir = parentDir
    }

    return null
  }

  /**
   * Merge user configuration with defaults
   */
  private mergeConfig(userConfig: RivetConfig): RivetConfig {
    return {
      engines: { ...DEFAULT_CONFIG.engines, ...userConfig.engines },
      ignore: userConfig.ignore ?? DEFAULT_CONFIG.ignore,
      include: userConfig.include ?? DEFAULT_CONFIG.include,
      severity: {
        minLevel: userConfig.severity?.minLevel ?? DEFAULT_CONFIG.severity.minLevel,
      },
      output: {
        format: userConfig.output?.format ?? DEFAULT_CONFIG.output.format,
        path: userConfig.output?.path ?? DEFAULT_CONFIG.output.path,
      },
    }
  }
}

/**
 * Create a new config loader instance
 */
export function createConfigLoader(): ConfigLoader {
  return new ConfigLoaderImpl()
}

/**
 * Load configuration from the current working directory
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<RivetConfig> {
  const loader = createConfigLoader()
  const userConfig = await loader.load(cwd)

  if (!userConfig) {
    return DEFAULT_CONFIG
  }

  return {
    engines: { ...DEFAULT_CONFIG.engines, ...userConfig.engines },
    ignore: userConfig.ignore ?? DEFAULT_CONFIG.ignore,
    include: userConfig.include ?? DEFAULT_CONFIG.include,
    severity: {
      minLevel: userConfig.severity?.minLevel ?? DEFAULT_CONFIG.severity.minLevel,
    },
    output: {
      format: userConfig.output?.format ?? DEFAULT_CONFIG.output.format,
      path: userConfig.output?.path ?? DEFAULT_CONFIG.output.path,
    },
  }
}

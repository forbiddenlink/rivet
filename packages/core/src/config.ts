import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import type { Category, RivetConfig, Severity } from './types'

/**
 * Every analysis category RIVET ships. Used as the default engine selection.
 */
export const ALL_CATEGORIES: Category[] = [
  'security',
  'bugs',
  'smells',
  'performance',
  'architecture',
  'practices',
  'dependencies',
  'flows',
]

const SEVERITY_LEVELS: Severity[] = ['critical', 'high', 'medium', 'low', 'info']

export interface ConfigLoader {
  load(cwd: string): Promise<RivetConfig | null>
  findConfig(startDir: string): Promise<string | null>
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  // Every engine, not an empty list. An empty list reads as "run nothing", so the
  // previous default made `rivet scan` report zero issues on any project without
  // a config file — including one with hardcoded secrets and eval().
  engines: ALL_CATEGORIES,
  ignore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.git/**',
    '**/build/**',
    '**/coverage/**',
  ] as string[],
  include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'] as string[],
  exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'] as string[],
  severity: {
    minLevel: 'info' as const,
  },
  output: {
    format: 'console' as const,
    path: undefined,
  },
}

/**
 * The shape of the config file as documented in `docs/CONFIGURATION.md` and shipped
 * in `.rivetrc.json`. It is richer than the internal {@link RivetConfig} — engines
 * are split into enabled/disabled, severity uses `minimum`, and ignores are nested
 * under `paths`.
 */
interface DocumentedConfigFile {
  engines?: Category[] | { enabled?: Category[]; disabled?: Category[] }
  severity?: { minLevel?: Severity; minimum?: Severity; failOn?: Severity[] }
  ignore?: string[] | { paths?: string[]; rules?: string[] }
  include?: string[]
  exclude?: string[]
  output?: { format?: string; path?: string }
  maxIssues?: number
  respectGitignore?: boolean
}

function isSeverity(value: unknown): value is Severity {
  return typeof value === 'string' && (SEVERITY_LEVELS as string[]).includes(value)
}

function normalizeEngines(engines: DocumentedConfigFile['engines']): Category[] | undefined {
  if (Array.isArray(engines)) {
    return engines
  }
  if (!engines || typeof engines !== 'object') {
    return undefined
  }

  const enabled = engines.enabled ?? ALL_CATEGORIES
  const disabled = new Set(engines.disabled ?? [])
  return enabled.filter((category) => !disabled.has(category))
}

function normalizeIgnore(ignore: DocumentedConfigFile['ignore']): string[] | undefined {
  if (Array.isArray(ignore)) {
    return ignore
  }
  if (!ignore || typeof ignore !== 'object') {
    return undefined
  }
  return ignore.paths
}

/** `ignore.rules` was documented and typed, and nothing ever read it. */
function normalizeIgnoreRules(ignore: DocumentedConfigFile['ignore']): string[] | undefined {
  if (!ignore || Array.isArray(ignore) || typeof ignore !== 'object') {
    return undefined
  }
  return ignore.rules
}

type OutputFormat = NonNullable<NonNullable<RivetConfig['output']>['format']>

function normalizeFormat(format: string | undefined): OutputFormat | undefined {
  // `cli` is what the docs and the shipped .rivetrc.json call the terminal
  // reporter; the engine calls the same thing `console`.
  const normalized = format === 'cli' ? 'console' : format
  if (normalized === 'console' || normalized === 'json' || normalized === 'sarif') {
    return normalized
  }
  return undefined
}

/**
 * Translate a config file into the internal {@link RivetConfig}.
 *
 * The documented file format and the internal format drifted apart: a `.rivetrc.json`
 * written exactly as `docs/CONFIGURATION.md` describes was parsed into an object the
 * engine could not read, so `engines.disabled`, `ignore.paths`, and `severity.minimum`
 * were all silently discarded. Normalizing here keeps the documented format working
 * without forcing every caller to know about both.
 */
export function normalizeConfig(raw: unknown): RivetConfig {
  const file = (raw ?? {}) as DocumentedConfigFile

  const minLevel = isSeverity(file.severity?.minLevel)
    ? file.severity.minLevel
    : isSeverity(file.severity?.minimum)
      ? file.severity.minimum
      : undefined

  const normalized: RivetConfig = {}

  const engines = normalizeEngines(file.engines)
  if (engines) normalized.engines = engines

  const ignore = normalizeIgnore(file.ignore)
  if (ignore) normalized.ignore = ignore

  const ignoreRules = normalizeIgnoreRules(file.ignore)
  if (ignoreRules) normalized.ignoreRules = ignoreRules

  if (file.include) normalized.include = file.include
  if (file.exclude) normalized.exclude = file.exclude
  if (minLevel) normalized.severity = { minLevel }
  if (typeof file.maxIssues === 'number') normalized.maxIssues = file.maxIssues
  if (typeof file.respectGitignore === 'boolean') {
    normalized.respectGitignore = file.respectGitignore
  }

  const format = normalizeFormat(file.output?.format)
  if (format || file.output?.path) {
    normalized.output = {
      ...(format && { format }),
      ...(file.output?.path && { path: file.output.path }),
    }
  }

  return normalized
}

/**
 * Configuration file loader for RIVET
 * Supports rivet.config.js, rivet.config.mjs, rivet.config.cjs
 */
export class ConfigLoaderImpl implements ConfigLoader {
  private readonly configFiles = [
    'rivet.config.js',
    'rivet.config.mjs',
    'rivet.config.cjs',
    '.rivetrc',
    '.rivetrc.json',
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
      const rawConfig =
        configPath.endsWith('.json') || configPath.endsWith('.rivetrc')
          ? JSON.parse(await readFile(configPath, 'utf-8'))
          : await this.loadJavaScriptConfig(configPath)

      return this.mergeConfig(normalizeConfig(rawConfig))
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
      engines: userConfig.engines ?? DEFAULT_CONFIG.engines,
      ignore: userConfig.ignore ?? DEFAULT_CONFIG.ignore,
      include: userConfig.include ?? DEFAULT_CONFIG.include,
      exclude: userConfig.exclude ?? DEFAULT_CONFIG.exclude,
      severity: {
        minLevel: userConfig.severity?.minLevel ?? DEFAULT_CONFIG.severity.minLevel,
      },
      output: {
        format: userConfig.output?.format ?? DEFAULT_CONFIG.output.format,
        path: userConfig.output?.path ?? DEFAULT_CONFIG.output.path,
      },
      ...(userConfig.maxIssues !== undefined && { maxIssues: userConfig.maxIssues }),
      ...(userConfig.respectGitignore !== undefined && {
        respectGitignore: userConfig.respectGitignore,
      }),
    }
  }

  private async loadJavaScriptConfig(configPath: string): Promise<unknown> {
    const imported = await import(configPath)
    return imported.default ?? imported
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
    engines: userConfig.engines ?? DEFAULT_CONFIG.engines,
    ignore: userConfig.ignore ?? DEFAULT_CONFIG.ignore,
    include: userConfig.include ?? DEFAULT_CONFIG.include,
    exclude: userConfig.exclude ?? DEFAULT_CONFIG.exclude,
    severity: {
      minLevel: userConfig.severity?.minLevel ?? DEFAULT_CONFIG.severity.minLevel,
    },
    output: {
      format: userConfig.output?.format ?? DEFAULT_CONFIG.output.format,
      path: userConfig.output?.path ?? DEFAULT_CONFIG.output.path,
    },
    ...(userConfig.maxIssues !== undefined && { maxIssues: userConfig.maxIssues }),
    ...(userConfig.respectGitignore !== undefined && {
      respectGitignore: userConfig.respectGitignore,
    }),
  }
}

/**
 * Numeric log level thresholds. A logger will emit messages at or above its
 * configured level, and drop everything below it.
 *
 * @example
 * ```ts
 * const client = new Client({ logLevel: LogLevel.DEBUG });
 * ```
 */
export enum LogLevel {
    /** Verbose diagnostic information. */
    DEBUG = 0,
    /** General operational messages. */
    INFO = 1,
    /** Potentially harmful situations that are not yet errors. */
    WARN = 2,
    /** Runtime errors that are recoverable. */
    ERROR = 3,
    /** Severe errors that may cause the process to abort. */
    CRITICAL = 4,
    /** Suppress all output. */
    NONE = 5,
}

/**
 * Colorised, tagged logger used internally by the SDK.
 *
 * Each emitted line is prefixed with the SDK tag, the source file region, the
 * severity, and the current ISO timestamp.
 */
export class Logger {
    /** The minimum {@link LogLevel} at which this logger will emit output. */
    public level: LogLevel = LogLevel.INFO;

    /**
     * @param level - Minimum severity to output. Defaults to {@link LogLevel.INFO}.
     */
    constructor(level: LogLevel = LogLevel.INFO) {
        this.level = level;
    }

    /**
     * Introspects the call stack to determine the file name of the caller.
     * Used to tag log lines with their origin for easier debugging.
     */
    private getRegion(): string {
        const stack = new Error().stack;
        if (!stack) return 'unknown';

        const lines = stack.split('\n');
        const callerLine = lines[4];
        if (!callerLine) return 'unknown';

        const match = callerLine.match(/(?:at\s+)?(?:.*\((.*)\)|at\s+(.*))/);
        const fullPath = match?.[1] || match?.[2] || 'unknown';

        const parts = fullPath.split('/');
        return parts[parts.length - 1] || 'unknown';
    }

    /**
     * Formats a log message with ANSI colours, severity tag, region tag, and
     * timestamp.
     *
     * @param severity - Human-readable severity label (e.g. `"info"`).
     * @param message  - The message body to format.
     * @returns The fully formatted, colour-coded log string.
     */
    private format(severity: string, message: string): string {
        const severityLower = severity.toLowerCase();
        const colors = {
            reset: '\x1b[0m',
            gray: '\x1b[90m',
            blue: '\x1b[34m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            red: '\x1b[31m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            bold: '\x1b[1m',
        };

        const sColor =
            {
                debug: colors.blue,
                info: colors.green,
                warning: colors.yellow,
                error: colors.red,
                critical: colors.magenta + colors.bold,
            }[severityLower] || colors.reset;

        const sdkTag = `${colors.cyan}[sdk]${colors.reset}`;
        const regionTag = `${colors.gray}[${this.getRegion()}]${colors.reset}`;
        const severityTag = `${sColor}[${severityLower}]${colors.reset}`;
        const dateTag = `${colors.gray}[${new Date().toISOString()}]${colors.reset}`;

        return `${sdkTag} ${regionTag} ${severityTag} ${dateTag} - ${message}`;
    }

    /** Emits a debug message. */
    public debug(message: string): void {
        if (this.level <= LogLevel.DEBUG) {
            // eslint-disable-next-line no-console
            console.debug(this.format('debug', message));
        }
    }

    /** Emits an info message. */
    public info(message: string): void {
        if (this.level <= LogLevel.INFO) {
            // eslint-disable-next-line no-console
            console.info(this.format('info', message));
        }
    }

    /** Emits a warning message. */
    public warn(message: string): void {
        if (this.level <= LogLevel.WARN) {
            console.warn(this.format('warning', message));
        }
    }

    /** Emits an error message. */
    public error(message: string): void {
        if (this.level <= LogLevel.ERROR) {
            console.error(this.format('error', message));
        }
    }

    /** Emits a critical message. */
    public critical(message: string): void {
        if (this.level <= LogLevel.CRITICAL) {
            console.error(this.format('critical', message));
        }
    }
}

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    CRITICAL = 4,
    NONE = 5,
}

export class Logger {
    public level: LogLevel = LogLevel.INFO;

    constructor(level: LogLevel = LogLevel.INFO) {
        this.level = level;
    }

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

    private format(severity: string, message: string): string {
        const date = new Date().toISOString();
        const region = this.getRegion();

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

        const severityColors: Record<string, string> = {
            debug: colors.blue,
            info: colors.green,
            warning: colors.yellow,
            error: colors.red,
            critical: colors.magenta + colors.bold,
        };

        const sColor = severityColors[severity.toLowerCase()] || colors.reset;
        const sdkTag = `${colors.cyan}[sdk]${colors.reset}`;
        const regionTag = `${colors.gray}[${region}]${colors.reset}`;
        const severityTag = `${sColor}[${severity.toLowerCase()}]${colors.reset}`;
        const dateTag = `${colors.gray}[${date}]${colors.reset}`;

        return `${sdkTag} ${regionTag} ${severityTag} ${dateTag} - ${message}`;
    }

    public debug(message: string): void {
        if (this.level <= LogLevel.DEBUG) {
            console.debug(this.format('debug', message));
        }
    }

    public info(message: string): void {
        if (this.level <= LogLevel.INFO) {
            console.info(this.format('info', message));
        }
    }

    public warn(message: string): void {
        if (this.level <= LogLevel.WARN) {
            console.warn(this.format('warning', message));
        }
    }

    public error(message: string): void {
        if (this.level <= LogLevel.ERROR) {
            console.error(this.format('error', message));
        }
    }

    public critical(message: string): void {
        if (this.level <= LogLevel.CRITICAL) {
            console.error(this.format('critical', message));
        }
    }
}

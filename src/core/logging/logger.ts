export class Logger {
  private serviceName?: string;

  constructor(serviceName?: string) {
    this.serviceName = serviceName;
  }

  private format(level: string, message: string, meta?: Record<string, any>) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.serviceName,
      ...meta,
    });
  }

  private log(level: string, message: string, meta?: Record<string, any>) {
    const output = this.format(level, message, meta);

    if (level === 'error') {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  debug(message: string, meta?: Record<string, any>) {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, any>) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, any>) {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, any>) {
    this.log('error', message, meta);
  }
}

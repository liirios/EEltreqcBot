import {createLogger, format, transports} from "winston";
const {combine, timestamp, colorize, printf, json} = format;

const logFormat = printf(({level, message, label, timestamp}) => {
  return `${timestamp} - ${level}: ${message}`;
});

const logger = createLogger({
    level: "silly",
    transports: [
        new transports.Console({format: combine(timestamp(), colorize(), logFormat)}),
        new transports.File({format: combine(timestamp(), logFormat), filename: `./logs/${Date.now()}.log`}),
        new transports.File({format: combine(timestamp(), logFormat), filename: `./logs/full.log`}),
        new transports.File({format: combine(timestamp(), json()), filename: `./logs/full.json.log`})
    ]
});

export const error = logger.error.bind(logger);
export const warn = logger.warn.bind(logger);
export const info = logger.info.bind(logger);
export const http = logger.http.bind(logger);
export const verbose = logger.verbose.bind(logger);
export const debug = logger.debug.bind(logger);
export const silly = logger.silly.bind(logger);
export const query = logger.query.bind(logger);
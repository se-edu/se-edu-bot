import sourceMapSupport = require('source-map-support');
sourceMapSupport.install();

import Logger from './lib/Logger';
import childProcess = require('child_process');
import path = require('path');

export const logFileName = 'se-edu-bot.log';

function runServerWithLogging(): void {
    const logger = new Logger({
        fileName: 'se-edu-bot.log',
    });
    const stream = logger.getWritableStream();
    stream.write('Starting server...\n');
    const cp = childProcess.spawn(process.execPath, [
        path.resolve(__dirname, 'server.js'),
    ], {
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    let exited = false;
    cp.on('exit', (code, signal) => {
        exited = true;
        stream.end(`Server terminated with code ${code}, signal ${signal}\n`);
        process.exitCode = code;
    });
    cp.stdout.pipe(stream, { end: false });
    cp.stdout.pipe(process.stdout, { end: false });
    cp.stderr.pipe(stream, { end: false });
    cp.stderr.pipe(process.stderr, { end: false });
    const signalHandler = (signal: string) => {
        if (exited) {
            return;
        }
        stream.write(`Sending ${signal} to server...\n`);
        cp.kill(signal);
    };
    process.on('SIGUSR2', signalHandler.bind(undefined, 'SIGUSR2'));
    process.on('SIGINT', signalHandler.bind(undefined, 'SIGINT'));
    process.on('SIGTERM', signalHandler.bind(undefined, 'SIGTERM'));
}

if (require.main === module) {
    runServerWithLogging();
}

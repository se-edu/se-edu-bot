import rotatingFileStream = require('rotating-file-stream');
import os = require('os');
import stream = require('stream');
import assert = require('assert');
import fs = require('fs');
import path = require('path');

/**
 * Options to pass to {@link Logger}
 */
export interface LoggerOptions {
    /**
     * Number of log files to rotate.
     * They will be numbered from `0` to `NUM_FILES-1`.
     * (Default: 3)
     */
    numFiles?: number;

    /**
     * The base log file name.
     */
    fileName: string;
}

/**
 * Represents a set of log files which are automatically rotated when they reach a certain size.
 */
export class Logger {
    private numFiles: number;
    private fileName: string;
    private writableStream?: NodeJS.WritableStream;

    constructor(options: LoggerOptions) {
        this.numFiles = options.numFiles || 3;
        this.fileName = options.fileName;
    }

    /**
     * Returns a writable stream which writes to the log file,
     * and rotates and prunes the log files as needed.
     */
    getWritableStream(): NodeJS.WritableStream {
        if (this.writableStream) {
            return this.writableStream;
        }

        const fileNameGenerator = (index: number | null): string => {
            assert.notStrictEqual(index, 0);
            return this.getLogFileName(index === null ? 0 : index);
        };
        this.writableStream = rotatingFileStream(fileNameGenerator, {
            path: os.tmpdir(),
            rotate: this.numFiles - 1,
            size: '1M',
        });
        return this.writableStream;
    }

    /**
     * Creates a new readable stream which accesses the contents of the log files,
     * in the order of the oldest un-pruned log file to newest log file.
     */
    createReadableStream(): NodeJS.ReadableStream {
        let currentIndex = this.numFiles - 1;
        let currentStream: NodeJS.ReadableStream;

        const concatStream = new stream.Transform({
            transform: (chunk, encoding, callback) => {
                concatStream.push(chunk);
                callback();
            },
        });
        const openFile = () => {
            if (currentIndex < 0) {
                concatStream.push(null);
                return;
            }
            currentStream = fs.createReadStream(path.join(os.tmpdir(), this.getLogFileName(currentIndex)));
            currentStream.on('error', (e: any) => {
                if (e && e.code === 'ENOENT') {
                    currentIndex--;
                    return openFile();
                }
                concatStream.emit('error', e);
            });
            currentStream.on('end', () => {
                currentIndex--;
                openFile();
            });
            currentStream.pipe(concatStream, { end: false });
        };

        openFile();
        return concatStream;
    }

    private getLogFileName(index: number): string {
        return `${this.fileName}.${index}`;
    }
}

export default Logger;

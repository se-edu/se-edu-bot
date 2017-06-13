interface RotatingFileStream extends NodeJS.WritableStream {
}

declare namespace RotatingFileStream {
  interface Options {
    compress?: boolean | 'gzip' | CompressFunction;
    highWaterMark?: number;
    history?: string;
    interval?: string;
    maxFiles?: number;
    maxSize?: string;
    path?: string;
    rotate?: number;
    size?: string;
  }

  interface Constructor {
    (filename: string | RotatedFileNameGenerator, options?: Options): RotatingFileStream;
    new(filename: string | RotatedFileNameGenerator, options?: Options): RotatingFileStream;
  }

  export type RotatedFileNameGenerator = ((time: Date | null, index: number) => string) | ((index: number | null) => string);
  export type CompressFunction = (src: string, dst: string) => string;
}

declare const RotatingFileStream: RotatingFileStream.Constructor;

export = RotatingFileStream;

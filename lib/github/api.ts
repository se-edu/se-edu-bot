import request = require('request-promise-native');
import jwt = require('jsonwebtoken');

/**
 * GitHub API base endpoint.
 */
export const baseUrl = 'https://api.github.com/';

/**
 * Accept header sent to the GitHub API.
 */
export const acceptHeader = [
    'application/vnd.github.machine-man-preview+json',
    'application/json',
].join(' ');

const dummyRequestApi = request.defaults({});

/**
 * Request API that provides methods for accessing the GitHub API.
 */
export type RequestApi = typeof dummyRequestApi;

/**
 * Options to pass to {@link createApi}
 */
export interface CreateApiOptions {
    userAgent: string;
    authorization?: string;
}

/**
 * Creates a {@link RequestApi} that accesses the GitHub API.
 */
export function createApi(options: CreateApiOptions): RequestApi {
    const headers: {[key: string]: string} = {};
    headers['user-agent'] = options.userAgent;
    headers['accept'] = acceptHeader;
    if (options.authorization) {
        headers['authorization'] = options.authorization;
    }

    return request.defaults({
        baseUrl: baseUrl,
        headers,
        json: true,
    });
}

/**
 * Options to pass to {@link createAppApi}
 */
export interface CreateAppApiOptions {
    userAgent: string;

    /**
     * PEM-encoded RSA private key.
     */
    privateKey: string;

    /**
     * Application ID.
     */
    appId: number;

    /**
     * Lifetime of the authorization token, in seconds. (10 minute maximum)
     */
    expiresIn: number;
}

/**
 * Creates a {@link RequestApi} that authorizes as a GitHub App.
 */
export function createAppApi(options: CreateAppApiOptions): RequestApi {
    const payload: object = {
        iss: options.appId,
    };
    const token: string = jwt.sign(payload, options.privateKey, {
        algorithm: 'RS256',
        expiresIn: options.expiresIn,
    });
    return createApi({
        authorization: `Bearer ${token}`,
        userAgent: options.userAgent,
    });
}

/**
 * Options to pass to {@link createAccessTokenApi}.
 */
export interface CreateAccessTokenApiOptions {
    userAgent: string;
    accessToken: string;
}

/**
 * Creates a {@link RequestApi} that authorizes as a GitHub user or installation using an access token.
 */
export function createAccessTokenApi(options: CreateAccessTokenApiOptions): RequestApi {
    return createApi({
        authorization: `token ${options.accessToken}`,
        userAgent: options.userAgent,
    });
}

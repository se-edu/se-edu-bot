import {
    baseUrl,
    RequestApi,
} from './api';
import request = require('request-promise-native');
import url = require('url');

export async function forEachPage(ghApi: RequestApi, opts: request.OptionsWithUrl,
        fn: (body: any) => (Promise<void> | void)): Promise<void> {
    const fullOpts = Object.assign({}, opts, {
        resolveWithFullResponse: true,
    });

    while (true) {
        const resp = await ghApi(fullOpts);

        const fnRet = fn(resp.body);
        if (fnRet) {
            await fnRet;
        }

        if (!resp.headers['link']) {
            return;
        }

        const links = parseLinks(resp.headers['link']);
        const linksNext = links.next;
        if (!linksNext) {
            return;
        }

        if (!linksNext.startsWith(baseUrl)) {
            throw new Error(`invalid next page url ${links.next}`);
        }

        const nextPath = url.parse(linksNext).path;
        Object.assign(fullOpts, {
            method: 'GET',
            url: nextPath,
        });
    }
}

function parseLinks(link: string): { [key: string]: string | undefined } {
    const links: { [key: string]: string | undefined } = {};

    link.replace(/<([^>]*)>;\s*rel="([\w]*)\"/g, (m: any, uri: string, type: string): string => {
        links[type] = uri;
        return '';
    });

    return links;
}

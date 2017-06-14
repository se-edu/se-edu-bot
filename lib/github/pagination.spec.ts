import {
    suite,
    test,
} from 'mocha-typescript';
import {
    baseUrl,
    RequestApi,
} from './api';
import {
    forEachPage,
} from './pagination';
import nock = require('nock');
import request = require('request-promise-native');
import assert = require('assert');

/**
 * Tests for {@link forEachPage}
 */
@suite
export class ForEachPageTest {
    private ghApi: RequestApi;
    private baseNock: nock.Scope;

    before(): void {
        this.ghApi = request.defaults({
            baseUrl,
        });
        this.baseNock = nock(baseUrl);
    }

    after(): void {
        const nockDone = nock.isDone();
        nock.cleanAll();
        assert(nockDone, '!nock.isDone()');
    }

    @test
    async 'goes to the next page if present'(): Promise<void> {
        const expectedReply1 = 'Hello World';
        const expectedReply2 = 'Goodbye World!';
        this.baseNock
            .get('/a')
            .reply(200, expectedReply1, {
                link: `<${baseUrl}b?page=2>; rel="next", <${baseUrl}>a>; rel="prev"`,
            })
            .get('/b?page=2')
            .reply(200, expectedReply2, {
                link: `<${baseUrl}a>; rel="prev"`,
            });
        let i = 0;
        await forEachPage(this.ghApi, {
            url: '/a',
        }, body => {
            switch (i++) {
            case 0:
                assert.strictEqual(body, expectedReply1);
                break;
            case 1:
                assert.strictEqual(body, expectedReply2);
                break;
            default:
                throw new Error('callback called too many times');
            }
        });
    }

    @test
    async 'resolves promises returned by the callback'(): Promise<void> {
        this.baseNock
            .get('/a')
            .reply(200, '', {
                link: `<${baseUrl}b>; rel="next"`,
            })
            .get('/b')
            .reply(200);
        let i = 0;
        let promiseResolved = false;
        await forEachPage(this.ghApi, {
            url: '/a',
        }, async body => {
            switch (i++) {
            case 0:
                await Promise.resolve();
                promiseResolved = true;
                break;
            case 1:
                break;
            default:
                throw new Error('callback called too many times');
            }
        });
        assert(promiseResolved, 'promise was not resolved');
    }

    @test
    async 'throws error if next page url is not github'(): Promise<void> {
        this.baseNock
            .get('/a')
            .reply(200, '', {
                link: `<https://badapi.github.com/b>; rel="next"`,
            });
        try {
            await forEachPage(this.ghApi, {
                url: '/a',
            }, body => {});
        } catch (e) {
            assert.strictEqual(e.message, 'invalid next page url https://badapi.github.com/b');
            return;
        }
        throw new Error('exception not thrown');
    }
}

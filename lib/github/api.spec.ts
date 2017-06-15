import assert = require('assert');
import nock = require('nock');
import {
    suite,
    test,
} from 'mocha-typescript';
import {
    acceptHeader,
    baseUrl,
    createApi,
    RequestApi,
} from './api';

/**
 * Tests for {@link createApi}
 */
@suite
export class CreateApiTest {
    private static userAgent = 'se-edu-bot';
    private static authorization = 'token abcdefg123';
    private ghApi: RequestApi;
    private baseNock: nock.Scope;

    before(): void {
        this.ghApi = createApi({
            authorization: CreateApiTest.authorization,
            userAgent: CreateApiTest.userAgent,
        });
        this.baseNock = nock(baseUrl, {
            reqheaders: {
                'Accept': acceptHeader,
                'Authorization': CreateApiTest.authorization,
                'User-Agent': CreateApiTest.userAgent,
            },
        });
    }

    after(): void {
        const nockDone = nock.isDone();
        nock.cleanAll();
        assert(nockDone, '!nock.isDone()');
    }

    @test
    async 'get'(): Promise<void> {
        const expectedReply = { hello: 'world' };
        this.baseNock.get('/')
                    .reply(200, expectedReply);
        const actualReply = await this.ghApi.get('');
        assert.deepStrictEqual(actualReply, expectedReply);
    }
}

import {
    suite,
    test,
} from 'mocha-typescript';
import {
    createApp,
} from './server';

/**
 * Tests for {@link createApp}.
 */
@suite
export class CreateAppTest {
    @test
    'works'(): void {
        createApp({
            githubAppId: 123,
            githubAppPrivateKey: '',
            githubClientId: 'abc',
            githubClientSecret: 'abc',
            githubInstallationId: 123,
            githubWebhookSecret: 'abcd123',
            proxy: false,
        });
    }
}

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
            proxy: false,
        });
    }
}

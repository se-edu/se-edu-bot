import * as github from '../lib/github';
import BaseLogic from './BaseLogic';

/**
 * Praises Pull Requests when they are merged.
 */
export default class PraiseMergedPrLogic extends BaseLogic {
    async onPullRequest(event: github.PullRequestEvent, ghApi: github.RequestApi): Promise<void> {
        if (event.action !== 'closed' || !event.pull_request.merged) {
            return;
        }

        const owner = event.repository.owner.login;
        const repo = event.repository.name;
        await ghApi.post(`repos/${owner}/${repo}/issues/${event.number}/comments`, {
            json: {
                body: `Well done @${event.pull_request.user.login}!`,
            },
        });
    }
}

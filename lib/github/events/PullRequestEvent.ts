import {
    Enum,
} from 'typescript-string-enums';

const Action = Enum(
    'assigned',
    'unassigned',
    'review_requested',
    'review_request_removed',
    'labeled',
    'unlabeled',
    'opened',
    'edited',
    'closed',
    'reopened');
type Action = Enum<typeof Action>;

/**
 * Triggered when a pull request is assigned, unassigned, labeled, unlabeled, opened,
 * edited, closed, reopened or synchronized.
 * Also triggered when a pull request review is requested, or when a review request is removed.
 */
export interface PullRequestEvent {
    action: Action;
    number: number;
    pull_request: {
        merged: boolean;
        user: {
            login: string;
        };
    };
    repository: {
        name: string;
        owner: {
            login: string;
        };
    };
}

export default PullRequestEvent;

import * as http from 'node:http';

import { Octokit } from '@octokit/rest';
import { createNodeMiddleware, Webhooks } from '@octokit/webhooks';

export function createServer(): http.Server {
  const octokit = new Octokit({ auth: process.env.GH_TOKEN });

  const webhooks = new Webhooks({
    secret: process.env.WEBHOOK_SECRET ?? '',
  });

  webhooks.on('release.created', async (ctx): Promise<void> => {
    const repo = ctx.payload.repository;

    if (
      !['bangumi/server-private', 'bangumi/server', 'bangumi/service-timeline'].includes(
        repo.full_name,
      )
    ) {
      return;
    }

    await octokit.request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
      owner: 'trim21',
      repo: 'actions-cron',
      workflow_id: 'mirror-docker.yaml',
      ref: 'master',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  return http.createServer(createNodeMiddleware(webhooks));
}

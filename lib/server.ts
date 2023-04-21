import * as http from 'node:http';

import { Octokit } from '@octokit/rest';
import { createNodeMiddleware, Webhooks } from '@octokit/webhooks';

import { logger } from '@app/lib/logger.ts';

export function createServer(): http.Server {
  const octokit = new Octokit({ auth: process.env.GH_TOKEN });

  const webhooks = new Webhooks({
    secret: process.env.WEBHOOK_SECRET ?? '',
  });

  webhooks.on('package.published', async (ctx): Promise<void> => {
    const pkg = ctx.payload.package;

    const pkgName = `${pkg.namespace}/${pkg.name}`;

    if (!['bangumi/private-server', 'bangumi/chii', 'bangumi-ms-timeline'].includes(`${pkg.namespace}/${pkg.name}`)) {
      logger.info(`ignore package ${pkgName}`);
      return;
    }

    const tag = pkg.package_version?.container_metadata?.tag?.name;
    if (!tag) {
      return;
    }

    if (tag.startsWith('base-')) {
      logger.info(`ignore base image '${tag}'`);
      return;
    }

    const res = await octokit.request('POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
      owner: 'trim21',
      repo: 'actions-cron',
      workflow_id: 'mirror-docker.yaml',
      ref: 'master',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (res.status !== 204) {
      logger.error(`failed to handle event ${ctx.id}:\n`, res.data);
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  return http.createServer(createNodeMiddleware(webhooks));
}

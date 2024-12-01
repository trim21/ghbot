import * as console from 'node:console';
import * as process from 'node:process';

import config from '@app/lib/config';
import { logger } from '@app/lib/logger.ts';
import { createServer } from '@app/lib/server.ts';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('check ./lib/config.ts for all available env');
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit();
}

const server = createServer();

const { host, port } = config.server;
server.listen({ port: port, host: host }, () => {
  logger.info(`github event listener start  http://127.0.0.1:${port}/`);
  logger.flush();
});

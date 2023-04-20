import * as fs from 'node:fs';
import * as path from 'node:path';
import * as process from 'node:process';
import * as url from 'node:url';

import type { Static, TObject, TProperties, TSchema } from '@sinclair/typebox';
import { Kind, Type as t } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import ajvKeywords from 'ajv-keywords';
import * as yaml from 'js-yaml';
import * as lo from 'lodash-es';

// read from env

const { NODE_ENV, REF, CHII_CONFIG_FILE } = process.env;

export const production = NODE_ENV === 'production';
export const developing = NODE_ENV === 'development';
export const testing = NODE_ENV === 'test';

export const projectRoot = url.fileURLToPath(new URL('..', import.meta.url));
export const pkg = JSON.parse(
  fs.readFileSync(path.resolve(projectRoot, 'package.json'), 'utf8'),
) as { version: string };

export const VERSION = developing ? 'development' : REF || pkg.version;

function Obj<T extends TProperties>(properties: T): TObject<T> {
  return t.Object(properties, { additionalProperties: false });
}

export const schema = Obj({
  server: Obj({
    port: t.Integer({ default: 4000, env: 'PORT' }),
    host: t.String({ default: '0.0.0.0', env: 'HOST' }),
  }),
});

function readConfig(): Static<typeof schema> {
  const configFilePath = CHII_CONFIG_FILE || path.resolve(projectRoot, 'config.yaml');

  let configFileContent = '{}';
  if (fs.existsSync(configFilePath)) {
    configFileContent = fs.readFileSync(configFilePath, 'utf8');
  }

  const config = lo.merge(Value.Create(schema), yaml.load(configFileContent));

  function readFromEnv(keyPath: string[], o: TSchema) {
    if (o[Kind] === 'Object') {
      for (const [key, value] of Object.entries(o.properties as Record<string, TSchema>)) {
        readFromEnv([...keyPath, key], value);
      }

      return;
    }

    const envKey = o.env as string | undefined;
    if (envKey) {
      const v = process.env[envKey];
      if (v !== undefined) {
        lo.set(config, keyPath, v);
      }
    }
  }

  readFromEnv([], schema);

  validateConfig(config);

  return config;
}

export function validateConfig(config: unknown) {
  const ajv = new Ajv({ allErrors: true, coerceTypes: true, keywords: ['env'], strict: false });
  addFormats(ajv);
  ajvKeywords(ajv, 'transform');

  const valid = ajv.validate(schema, config);

  if (!valid) {
    const errorMessage =
      ajv.errors
        ?.map((x) => {
          if (x.keyword === 'additionalProperties') {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            return `$${x.instancePath}: ${x.message}: ${JSON.stringify(
              x.params.additionalProperty,
            )}`;
          }

          return '  ' + (x.instancePath + ': ' + (x.message ?? `wrong data type ${x.schemaPath}`));
        })
        .join('\n') ?? '';

    throw new TypeError('failed to validate config file:\n' + errorMessage);
  }
}

// read config file
const config: Static<typeof schema> = readConfig();

export default config;

FROM node:18-slim@sha256:b50c0b5628a4a10093a2b4b8b7a7060c10e5983abb8ea89a7892fc6ddb0730e3 as builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn --prod && \
    rm package.json yarn.lock

FROM gcr.io/distroless/nodejs18-debian11:latest@sha256:af46ad3a1c8b82e6c1dfbbbd175b4b455a35b846ffc4a8cda7cb5b7031113bff

ENTRYPOINT [ "/nodejs/bin/node", "--no-warnings", "--loader=@esbuild-kit/esm-loader", "--enable-source-maps", "./bin/main.ts" ]

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/ /app

FROM node:20.16.0-slim@sha256:a22f79e64de59efd3533828aecc9817bfdc1cd37dde598aa27d6065e7b1f0abc as builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn --prod && \
    rm package.json yarn.lock

FROM gcr.io/distroless/nodejs20

ENTRYPOINT [ "/nodejs/bin/node", "--no-warnings", "--loader=@esbuild-kit/esm-loader", "--enable-source-maps", "./bin/main.ts" ]

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/ /app

FROM node:22.12.0@sha256:0e910f435308c36ea60b4cfd7b80208044d77a074d16b768a81901ce938a62dc as builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn --prod && \
    rm package.json yarn.lock

FROM gcr.io/distroless/nodejs22

ENTRYPOINT [ "/nodejs/bin/node", "--no-warnings", "--loader=@esbuild-kit/esm-loader", "--enable-source-maps", "./bin/main.ts" ]

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/ /app

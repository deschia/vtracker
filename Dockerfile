FROM alpine:3.12 AS builder
RUN apk update
RUN apk add --no-cache nodejs yarn musl-dev
RUN yarn add react-script

FROM nginx:1.19-alpine AS release
COPY build/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
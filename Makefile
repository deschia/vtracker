APP_NAME=vtracker
APP_VERSION=unknown
BUILDER_NAME=app-builder
BUILDER_VERSION=unknown
DEV_PORT=3000
PROD_PORT=8080

RUN=docker run --rm --network host -v ${CURDIR}/:/opt/app/${APP_NAME} -w /opt/app/${APP_NAME} ${BUILDER_NAME}:${BUILDER_VERSION}
RUN_PROD=docker run --rm -p ${PROD_PORT}:80 ${APP_NAME}:${APP_VERSION}

.PHONY: build
build:
	DOCKER_BUILDKIT=1 docker build --target builder -t ${BUILDER_NAME}:${BUILDER_VERSION} .
	${RUN} yarn build
	DOCKER_BUILDKIT=1 docker build --target release -t ${APP_NAME}:${APP_VERSION} .

dev:
	DOCKER_BUILDKIT=1 docker build --target builder -t ${BUILDER_NAME}:${BUILDER_VERSION} .
	${RUN} yarn install
	docker-compose up

prod:
	${RUN_PROD}
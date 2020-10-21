-include .env

DOCKER_REGISTRY=eoscostarica506
DOCKER_USERNAME=eoscostarica506
MIDDLEWARE_IMAGE_NAME=writer-node-middleware
MIDDLEWARE_VERSION ?= $(shell git ls-files -s ./src | git hash-object --stdin)
MAKE_ENV += MIDDLEWARE_VERSION MIDDLEWARE_IMAGE_NAME DOCKER_REGISTRY DOCKER_USERNAME

SHELL_EXPORT := $(foreach v,$(MAKE_ENV),$(v)='$($(v))')

ifneq ("$(wildcard .env)", "")
	export $(shell sed 's/=.*//' .env)
endif

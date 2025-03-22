.PHONY: all
.SILENT:
ARGS = `arg="$(filter-out $@,$(MAKECMDGOALS))" && echo $${arg:-${1}}`
%:
	@:


server-up:
	docker compose up -d --build

server-down:
	docker compose down

install:
	pip install -e .

run-uwsgi:
	uwsgi --http 0.0.0.0:8080 --master -p 2 -w src.wsgi:app

run-frontend:
	cd frontend && npm run dev

deploy:
	@echo "Deploying code to ${TARGET_HOST}"
	rsync -pthrvz --delete --exclude=*.egg-info --exclude=frontend/node_modules --exclude=.* --exclude=.pytest_cache --exclude=*.pyc --exclude=*.md --exclude=__pycache__ --exclude=migration ./* ${TARGET_HOST}:~/code

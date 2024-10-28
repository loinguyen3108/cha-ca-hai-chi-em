.PHONY: all


build-chaca:
	docker build -t chaca-platform:local .

install:
	pip install -e .

run-uwsgi:
	uwsgi --http 0.0.0.0:8000 --master -p 2 -w src.wsgi:app

deploy:
	@echo "Deploying code to ${TARGET_HOST}"
	rsync -pthrvz --delete --exclude=*.egg-info --exclude=.* --exclude=.pytest_cache --exclude=*.pyc --exclude=*.md --exclude=__pycache__ --exclude=migration ./* ${TARGET_HOST}:~/code

DEPLOYABLE_FILES = index.html tetris.js tetris.css analytics.js

.PHONY: default deploy

default:
	true

deploy: $(DEPLOYABLE_FILES)
	./deploy.sh $(DEPLOYABLE_FILES)

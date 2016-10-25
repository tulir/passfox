all: docs xpi scss

scss:
	node-sass --output data data/panel.scss

xpi:
	jpm xpi --dest-dir dist/

docs:
	jsdoc -d dist/doc/ -r .

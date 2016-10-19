all: scss xpi

scss:
	node-sass --output data data/panel.scss

xpi:
	jpm xpi

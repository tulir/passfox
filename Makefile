all: scss xpi

scss:
	node-sass --output data data/panel.scss

xpi:
	rm -f passfox.xpi
	jpm xpi

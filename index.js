// passFox - A passwordstore.org extension for Firefox
// Copyright (C) 2016 Tulir Asokan

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
let self = require("sdk/self")
let pass = require("pass/store")
let exec = require("pass/exec")
let clipboard = require("sdk/clipboard");
let { setTimeout } = require('sdk/timers');
let notifications = require("sdk/notifications");
let { env } = require("sdk/system/environment")

let store = new pass.PasswordStore()
let prefs = [
	"PASSWORD_STORE_CLIP_TIME=10",
	"PASSWORD_STORE_DIR=" + env.HOME + "/.password-store",
	"DISPLAY=" + (env.DISPLAY !== undefined ? env.DISPLAY : ":0.0"),
	"PATH=" + env.PATH,
	"GNUPGHOME=" + env.HOME + "/.gnupg",
	"SHELL=/bin/bash"
]

let panel = require("sdk/panel").Panel({
	contentURL: "./panel.html",
	onHide: () => button.state('window', {checked: false}),
	height: 250,
	width: 300
})

let button = require("sdk/ui").ToggleButton({
	id: "pass",
	label: "Pass",
	icon: "./icon.svg",
	onClick: state => {
		if (state.checked) {
			panel.show({position: button})
			if (JSON.stringify(store.store) === "{}") {
				update()
			}
		}
	}
})

function update() {
	let result = exec.runPass(["ls"], prefs)
	store.parseFull(result.stdout.split("\n"))
	panel.port.emit("pass.list", store.store)
}

panel.port.on("pass.search", query => {
	let results = store.search(query)
	if (results.length > 20) {
		panel.port.emit("pass.search.toomanyresults")
	} else if (results.length === 0) {
		panel.port.emit("pass.search.noresults")
	} else {
		panel.port.emit("pass.search.results", results)
	}
})

panel.port.on("pass.update", update)

panel.port.on("pass.getlist", path => {
	panel.port.emit("pass.list", store.dynamicGet(path))
})

panel.port.on("pass.action", (action, path, password) => {
	let fullPath = path.concat([password]).join("/")
	let result = ""
	switch(action) {
	case "copy-password":
		result = exec.runPass(["show", "-c", fullPath], prefs)
		console.info(result)
		panel.port.emit("pass.action.done", "copy-password", path, password)
		notifications.notify({
			title: "Password copied",
			text: "/" + fullPath,
		});
		break
	case "copy-username":
		result = exec.runPass(["show", fullPath], prefs)
		// Find the line starting with "Username: "
		let username = result.stdout.split("\n").find(line => {
			if (line.toLowerCase().startsWith("username: ")) {
				return true
			}
		})
		// Cut the "Username: " prefix out
		username = username.substr("username: ".length)
		clipboard.set(username)
		setTimeout(() => {
			clipboard.set("Lorem ipsum dolor sit amet")
			clipboard.set("")
		}, prefs.PASSWORD_STORE_CLIP_TIME * 1000)
		panel.port.emit("pass.action.done",
			"copy-username", path, password)
		notifications.notify({
			title: "Username copied",
			text: "/" + fullPath,
		})
		break
	}
})

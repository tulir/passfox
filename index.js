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
let clipboard = require("sdk/clipboard")
let { setTimeout } = require('sdk/timers')
let notifications = require("sdk/notifications")
let { env } = require("sdk/system/environment")

let store = new pass.PasswordStore()
let prefs = {
	PASSWORD_STORE_CLIP_TIME: 10,
	PASSWORD_STORE_DIR: env.HOME + "/.password-store",
	GNUPGHOME: env.HOME + "/.gnupg",
	HOME: env.HOME,
	USER: env.USER,
	GPG_AGENT_INFO: env.GPG_AGENT_INFO,
	DISPLAY: (env.DISPLAY !== undefined ? env.DISPLAY : ":0.0"),
	PATH: env.PATH,
	SHELL: "/bin/bash"
}

let panel = require("sdk/panel").Panel({
	contentURL: "./panel.html",
	onHide: () => button.state('window', {checked: false}),
	height: 320,
	width: 432
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
	exec.pass(["ls"], prefs, (status, data, err) => {
		store.parseFull(data.split("\n"))
		panel.port.emit("pass.list", store.store)
	})
}

panel.port.on("pass.update", update)

panel.port.on("show", () => panel.port.emit("show"))

panel.port.on("pass.search", query =>
	panel.port.emit("pass.search.results", store.search(query))
)

panel.port.on("pass.list.get", path =>
	panel.port.emit("pass.list", store.dynamicGet(path))
)

panel.port.on("pass.action.copy-password", fullPath => {
	panel.hide()
	exec.getPassword(fullPath, prefs, (passwd, status, data, err) => {
		if (failed(err)) {
			return
		}
		copy(passwd, fullPath, "Password")
	})
})

panel.port.on("pass.action.copy-username", fullPath => {
	panel.hide()
	exec.getValue(fullPath, ["Username", "User", "Email"], prefs, (val, status, data, err) => {
		if (failed(err)) {
			return
		}
		copy(val, fullPath, "Username")
	})
})

panel.port.on("pass.action.copy-totp", fullPath => {
	panel.hide()
	exec.getValue(fullPath, ["TOTP", "OTP"], prefs, (val, status, data, err) => {
		if (failed(err)) {
			return
		}
		copy(val, fullPath, "TOTP")
	})
})

function failed(err) {
	if (err.indexOf("gpg: decryption failed") !== -1) {
		notifications.notify({
			title: "Failed to decrypt password!",
			text: err
		})
		return true
	}
}

function copy(val, path, name) {
	clipboard.set(val)
	setTimeout(() => {
		clipboard.set("Lorem ipsum dolor sit amet")
		clipboard.set("")
	}, prefs.PASSWORD_STORE_CLIP_TIME * 1000)
	notifications.notify({
		title: name + " for " + path + " copied",
		text: "Clearing in " + prefs.PASSWORD_STORE_CLIP_TIME + " seconds",
	})
}

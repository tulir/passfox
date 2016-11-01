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
const pass = require("pass/store")
const exec = require("pass/exec")
const config = require("pass/config")
const clipboard = require("sdk/clipboard")
const { setTimeout } = require('sdk/timers')
const notifications = require("sdk/notifications")

let store = new pass.PasswordStore()

let panel = require("sdk/panel").Panel({
	contentURL: "./panel.html",
	onHide: () => button.state('window', {checked: false}),
	height: 320,
	width: 440 // 20rem * 27.5rem
})

let button = require("sdk/ui").ToggleButton({
	id: "pass",
	label: "Pass",
	icon: "./icon.svg",
	onClick: state => {
		if (state.checked) {
			panel.show({position: button})
			if (!store.loaded) {
				update([])
			}
		}
	}
})

function update(path) {
	exec.list((data, err) => {
		if (err.indexOf("Error: password store is empty") !== -1) {
			panel.port.emit("pass.empty")
			return
		}
		store.parseFull(data.split("\n"))
		panel.port.emit("pass.list", store.dynamicGet(path))
	})
}

panel.port.on("pass.update", update)

panel.port.on("pass.init", () => exec.init(() => update([])))

panel.port.on("pass.search", query =>
	panel.port.emit("pass.search.results", store.search(query))
)

panel.port.on("pass.list.get", path =>
	panel.port.emit("pass.list", store.dynamicGet(path))
)

panel.port.on("pass.insert", (path, password, data) =>
	exec.insert(path.concat([password]).join("/"), data, () =>
		panel.port.emit("pass.insert.done")
	)
)

panel.port.on("pass.action", (action, path, password) => {
	panel.hide()
	let fullPath = path.concat([password]).join("/")
	switch(action) {
	case "copy-username":
		copyUsername(fullPath, password)
		break
	case "copy-password":
		copyPassword(fullPath, password)
		break
	case "copy-otp":
		copyOTP(fullPath, password)
		break
	case "display":
	case "edit":
		exec.get(fullPath, (data, err) => {
			panel.port.emit("pass." + action, data)
			panel.show({position: button})
		})
		break
	case "delete":
		exec.delete(fullPath, () => {
			update(path)
			panel.show({position: button})
		})
		break
	}
})

function copyPassword(fullPath, name) {
	exec.getPassword(fullPath, (passwd, err) => {
		if (failed(err, name)) {
			return
		}
		copy(passwd)
		notify(name, "Password")
	})
}

function copyUsername(fullPath, name) {
	exec.getValue(fullPath, ["Username", "User", "Email"], (val, err) => {
		if (failed(err, name)) {
			return
		}
		copy(val)
		notify(name, "Username")
	})
}

function copyOTP(fullPath, name) {
	exec.getOTP(fullPath, (otp, expiry, err) => {
		if (failed(err, name)) {
			return
		}
		copy(otp)
		notifications.notify({
			title: "OTP for " + name + " copied",
			text: "Expires in " + expiry + " seconds",
		})
	})
}

function failed(err, fullPath) {
	if (err.indexOf("gpg: decryption failed") !== -1) {
		notifications.notify({
			title: "Failed to decrypt password!",
			text: err
		})
		return true
	} else if (err.indexOf("is not in the password store.") !== -1) {
		notifications.notify({
			title: "Password not found",
			text: "There is no password at " + fullPath
		})
	} else if (err.indexOf("Error: No username found") !== -1) {
		notifications.notify({
			title: "No username key found in " + fullPath
		})
	} else if (err.indexOf("Error: No OTP key found") !== -1) {
		notifications.notify({
			title: "No OTP key found in " + fullPath
		})
	}
}

function copy(val) {
	clipboard.set(val)
	setTimeout(() => {
		clipboard.set("Lorem ipsum dolor sit amet")
		clipboard.set("")
	}, config.prefs.clipTime * 1000)
}

function notify(passName, objectName) {
	notifications.notify({
		title: objectName + " for " + passName + " copied",
		text: "Clearing in " + config.prefs.clipTime + " seconds",
	})
}

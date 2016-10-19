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

let store = new pass.PasswordStore()
let prefs = {
    PASSWORD_STORE_CLIP_TIME: 10,
    PASSWORD_STORE_DIR: "/home/tulir/.password-store"
}

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
    exec.runPass({PASSWORD_STORE_DIR: "/home/tulir/.password-store"}, ["ls"],
        (status, data, err) => {
        	store.parseFull(data.split("\n"))
            panel.port.emit("pass.list", store.store)
        }
    )
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
    switch(action) {
    case "copy-password":
        exec.runPass(prefs, ["show", "-c", path.concat([password]).join("/")],
            (status, data, err) => {
                console.info(status)
                console.log(data)
                console.error(err)
                panel.port.emit("pass.action.done",
                    "copy-password", path, password)
                notifications.notify({
                    title: "Password copied",
                    text: "/" + path.concat([password]).join("/"),
                });
            }
        )
        break
    case "copy-username":
        exec.runPass(prefs, ["show", path.concat([password]).join("/")],
            (status, data, err) => {
                // Find the line starting with "Username: "
                let username = data.split("\n").find(line => {
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
                    text: "/" + path.concat([password]).join("/"),
                });
            }
        )
        break
    }
})

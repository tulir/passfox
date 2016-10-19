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
var self = require("sdk/self")
var pass = require("pass/store")
var exec = require("pass/exec")

var panel = require("sdk/panel").Panel({
  contentURL: "./ui/panel.html",
  onHide: () => button.state('window', {checked: false})
})

panel.port.on("search", query => {
    console.log("Querying", query)
})

panel.port.on("update", update)

panel.port.on("getdata", path => {
    panel.port.emit("data", store.dynamicGet(path))
})

var button = require("sdk/ui").ToggleButton({
    id: "pass",
    label: "Pass",
    icon: "./icons/icon.svg",
    onClick: state => {
        if (state.checked) {
            panel.show({position: button})
            if (JSON.stringify(store.store) === "{}") {
                update()
            }
        }
    }
})

var store = new pass.PasswordStore()

function update() {
    exec.runPass({PASSWORD_STORE_DIR: "/home/tulir/.password-store"}, ["ls"],
        (status, data, err) => {
        	store.parseFull(data.split("\n"))
            panel.port.emit("data", store.store)
        }
    )
}

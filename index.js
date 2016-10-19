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

var store = new pass.PasswordStore()

var panel = require("sdk/panel").Panel({
  contentURL: "./ui/panel.html",
  onHide: () => button.state('window', {checked: false}),
  height: 250,
  width: 300
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

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
function search() {
	addon.port.emit("search", $("#search-box").val())
	console.log("Hmm?", $("#search-box").val())
}

function action(act) {
	addon.port.emit("action", act)
}

var path = []
var password = ""

function update() {
	addon.port.emit("update")
}

function passwordClick(name) {
	$("#passwords").addClass("hidden")
	$("#password-actions").removeClass("hidden")
	password = name
}

function directoryClick(name) {
	$("#passwords").removeClass("hidden")
	$("#password-actions").addClass("hidden")
	if (name === "..") {
		path = path.slice(0, path.length - 1)
	} else if (name.length > 0) {
		path[path.length] = name
	}
	addon.port.emit("getdata", path)
}

addon.port.on("data", data => {
	$("#passwords").empty()

	if (path.length > 0) {
		addEntry("directory", "..")
	}

	for (key in data) {
		if (typeof(data[key]) === "string") {
			addEntry("password", key)
		} else {
			addEntry("directory", key)
		}
	}
})

function addEntry(type, name) {
	$("#passwords").append(
		"<div \
		onClick='" + type + "Click(this.innerHTML)' \
		class='" + type + " entry'>"
			+ name +
		"</div>"
	)
}

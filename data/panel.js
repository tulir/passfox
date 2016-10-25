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
var path = []
var password = ""

function search() {
	let query = $("#search").val()
	if (query.length === 0) {
		addon.port.emit("pass.list.get", path)
	} else {
		addon.port.emit("pass.search", query)
	}
}

function action(act) {
	addon.port.emit("pass.action", act, path, password)
}

function update() {
	addon.port.emit("pass.update", path)
}

function passwordClick(name, searchClick) {
	$("#passwords").addClass("hidden")
	$("#password-actions").removeClass("hidden")
	if (searchClick) {
		// Remove prefix slash and split into a path array.
		path = name.substr(1).split("/")
		// Extract the last object of the path (the password).
		password = path[path.length-1]
		// Remove the last object (the password) from the path, so only the
		// directories are left in the path array.
		path = path.slice(0, path.length-1)
	} else {
		password = name
	}

	let pathStr = "/" + path.join("/")
	if (pathStr.length !== 1) {
		pathStr += "/"
	}
	$("#path").text(pathStr + password)
}

function exitPasswordView() {
	if (!$("#password-view").hasClass("hidden")) {
		$("#password-view").addClass("hidden")
		$("#password-actions").removeClass("hidden")
	} else if ($("#passwords").hasClass("hidden")
		|| !$("#password-actions").hasClass("hidden")) {
		$("#passwords").removeClass("hidden")
		$("#password-actions").addClass("hidden")
		addon.port.emit("pass.list.get", path)
	}
}

function directoryClick(name, searchClick) {
	if (searchClick) {
		// Remove the prefix and suffix slash and split into a path array.
		path = name.substr(1, name.length-2).split("/")
	} else if (name === "..") {
		path = path.slice(0, path.length - 1)
	} else if (name.length > 0) {
		path[path.length] = name
	}
	addon.port.emit("pass.list.get", path)
}

function addEntry(type, name, isSearchResult) {
	isSearchResult = isSearchResult ? "true" : "false"
	$("#passwords").append(
		"<div \
		onClick='" + type + "Click(this.innerHTML, " + isSearchResult + ")' \
		class='" + type + " entry'>"
			+ name +
		"</div>"
	)
}

addon.port.on("pass.display", data => {
	$("#password-raw-view").html(data.replace(/\n/g, "<br>"))
	$("#password-view").removeClass("hidden")
	$("#password-actions").addClass("hidden")
})

addon.port.on("pass.search.results", data => {
	exitPasswordView()
	$("#passwords").empty()

	if (data.length === 0) {
		$("#path").text("No results!")
	} else if (data.length > 20) {
		$("#path").text("Too many results!")
	}

	$("#path").text("Search results:")
	for (key of data) {
		addEntry(key.type, key.path, true)
	}
})

addon.port.on("pass.list", data => {
	exitPasswordView()
	$("#passwords").empty()

	if (path.length > 0) {
		addEntry("directory", "..")
	}

	let pathStr = "/" + path.join("/")
	if (pathStr.length !== 1) {
		pathStr += "/"
	}
	$("#path").text(pathStr)

	for (let key in data) {
		if (typeof(data[key]) === "string") {
			addEntry("password", key)
		} else {
			addEntry("directory", key)
		}
	}
})

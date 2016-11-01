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
let path = {
	dir: [],
	password: "",
	toUIString() {
		return "/" + this.toString()
	},
	toString() {
		return this.dir.concat([this.password]).join("/")
	},
	parseUIString(str) {
		if (str.endsWith("/")) {
			this.dir = str.substr(1, str.length - 2).split("/")
		} else {
			this.dir = str.substr(1).split("/")
			this.password = this.dir[this.dir.length - 1]
			this.dir = this.dir.slice(0, this.dir.length - 1)
		}
	},
	exit() {
		this.dir = this.dir.slice(0, this.dir.length - 1)
	},
	enter(newDir) {
		this.dir.push(newDir)
	}
}

$("#search").keyup(function() {
	let query = $(this).val()
	if (query.length === 0) {
		addon.port.emit("pass.list.get", path.dir)
	} else {
		addon.port.emit("pass.search", query)
	}
})

$(".action.entry").click(function() {
	addon.port.emit(
		"pass.action", $(this).attr("action"),
		path.dir, path.password
	)
})

$("#new-password").click(() => $("#password-create").removeClass("hidden"))

$("#update").click(() => addon.port.emit("pass.update", path.dir))

$("#init-store").click(() => {
	addon.port.emit("pass.init")
	$("#password-init").removeClass("hidden")
})

$(".exit.entry").click(exitPasswordView)

function exitPasswordView() {
	if (!$("#password-view").hasClass("hidden")) {
		$("#password-view").addClass("hidden")
		$("#path").text(path.toUIString())
	} else if (!$("#password-actions").hasClass("hidden")) {
		$("#password-actions").addClass("hidden")
		path.password = ""
		$("#path").text(path.toUIString())
	}
}

function passwordClick(name, searchClick) {
	$("#password-actions").removeClass("hidden")
	if (searchClick) {
		path.parseUIString(name)
	} else {
		path.password = name
	}

	$("#path").text(path.toUIString())
}
function directoryClick(name, searchClick) {
	if (searchClick) {
		path.parseUIString(name)
	} else if (name === "..") {
		path.exit()
	} else if (name.length > 0) {
		path.enter(name)
	}
	addon.port.emit("pass.list.get", path.dir)
}

function addEntry(type, name, isSearchResult) {
	let password = $("<div class='entry'></div>")
	password.addClass(type)
	password.text(name)
	if (type === "directory") {
		password.click(() => directoryClick(name, isSearchResult))
	} else if (type === "password") {
		password.click(() => passwordClick(name, isSearchResult))
	}
	password.appendTo($("#passwords"))
}

$("#cancel-create").click(() => $("#password-create").addClass("hidden"))

$("#next-create").click(() => {
	path.password = $("#new-password-name").val()
	$("#path").text("Editing " + path.toUIString())
	$("#password-edit").removeClass("hidden")
	$("#password-create").addClass("hidden")
})

$("#cancel-edit").click(() => {
	$("#password-edit").addClass("hidden")
	$("#password-raw-edit").empty()
	$("#path").text(path.toUIString())
	addon.port.emit("pass.list.get", path.dir)
})

$("#save-edit").click(() =>
	addon.port.emit(
		"pass.insert",
		path.dir, path.password,
		$("#password-raw-edit").val()
	)
)

$("#password-raw-edit").keydown(() => {
	$("#password-raw-edit").removeClass("saved")
	$("#save-edit").text("Save")
})

addon.port.on("pass.insert.done", () => {
	$("#password-raw-edit").addClass("saved")
	$("#save-edit").text("Saved ✓")
})

addon.port.on("pass.edit", data => {
	$("#password-raw-edit").val(data)
	$("#path").text("Editing " + path.toUIString())
	$("#password-edit").removeClass("hidden")
})

addon.port.on("pass.display", data => {
	$("#password-raw-view").html(data.replace(/\n/g, "<br>"))
	$("#path").text("Viewing " + path.toUIString())
	$("#password-view").removeClass("hidden")
})

addon.port.on("pass.search.results", data => {
	exitPasswordView()
	$("#passwords").empty()
	$("#passwords").addClass("search-results")

	if (data.length === 0) {
		$("#path").text("No results!")
	} else if (data.length > 20) {
		$("#path").text("Too many results!")
	} else {
		$("#path").text("Search results")
		for (key of data) {
			addEntry(key.type, key.path, true)
		}
	}
})

addon.port.on("pass.list", data => {
	exitPasswordView()
	$("#passwords").empty()
	$("#passwords").removeClass("search-results")

	if (path.dir.length > 0) {
		addEntry("directory", "..")
	}

	$("#path").text(path.toUIString())

	for (let key in data) {
		if (typeof(data[key]) === "string") {
			addEntry("password", key)
		} else {
			addEntry("directory", key)
		}
	}
})

addon.port.on("pass.empty", () => {
	$("#password-init").removeClass("hidden")
})

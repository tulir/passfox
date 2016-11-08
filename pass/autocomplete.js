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
/**
 * Password autocompletion module
 *
 * @module pass/autocomplete
 */

const tabs = require("sdk/tabs")
const tabUtils = require("sdk/tabs/utils")
const { viewFor } = require("sdk/view/core")

exports.test = function() {
	let tab = viewFor(tabs.activeTab)
	let browser = tabUtils.getBrowserForTab(tab)
	const $ = require("lib/jquery-3.1.1.min")(browser)
	let body = $(browser.contentDocument.body)
	console.error(body)
}

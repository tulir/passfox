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
var child_process = require("sdk/system/child_process")
var { env } = require("sdk/system/environment")

/**
 * Run the Password Store script
 *
 * @param dir The password store directory.
 * @param extraArgs An array containing the arguments for pass.
 * @param callback The callback function to call after execution.
 */
function runPass(prefs, args, callback) {
	prefs.HOME = env.HOME
	child_process.exec("/usr/bin/pass " + args.join(" "),
		{env: prefs, shell: prefs.SHELL}, callback)
}

exports.runPass = runPass

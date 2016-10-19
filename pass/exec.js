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
let child_process = require("sdk/system/child_process")
let { env } = require("sdk/system/environment")

let envsToCopy = ["HOME", "DISPLAY", "SSH_AGENT_PID", "XDG_SESSION_ID",
				"CLUTTER_IM_MODULE", "GTK_MODULES", "SSH_AUTH_SOCK",
				"SESSION_MANAGER", "PATH", "XDG_SESSION_TYPE", "XDG_SEAT",
				"XDG_SESSION_DESKTOP", "DBUS_SESSION_BUS_ADDRESS",
				"XDG_DATA_DIRS", "WINDOWPATH", "XDG_CURRENT_DESKTOP",
				"XAUTHORITY"]

/**
 * Run the Password Store script
 *
 * @param dir The password store directory.
 * @param extraArgs An array containing the arguments for pass.
 * @param callback The callback function to call after execution.
 */
function runPass(prefs, args, callback) {
	for (let val of envsToCopy) {
		prefs[val] = env[val]
	}
	prefs.GNUPGHOME = env.HOME + "/.gnupg"
	child_process.exec("/usr/bin/pass " + args.join(" "),
		{env: prefs, shell: prefs.SHELL}, callback)
}

exports.runPass = runPass

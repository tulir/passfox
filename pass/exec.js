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
//let child_process = require("sdk/system/child_process")
let { subprocess } = require("lib/subprocess.jsm")
let { env } = require("sdk/system/environment")

/**
 * Run the Password Store script
 *
 * @param dir The password store directory.
 * @param extraArgs An array containing the arguments for pass.
 * @param callback The callback function to call after execution.
 */
function runPass(args, env) {
	/*prefs.DISPLAY = (env.DISPLAY !== undefined ? env.DISPLAY : ':0.0')
	delete prefs.TREE_CHARSET
	let proc = child_process.exec("/usr/bin/pass " + args.join(" "),
		{env: prefs, shell: prefs.SHELL}, callback)*/
	let result = undefined
	let params = {
		command: "/usr/bin/pass",
		arguments: args,
		environment: env,
		charset: "UTF-8",
		mergeStderr: false,
		done: data => result = data
	}
	try {
		let p = subprocess.call(params)
		p.wait()
		if (result.exitCode !== 0) {
			console.error("`pass` execution failed:", result.exitCode)
			console.error(result.stderr)
			console.error(result.stdout)
		} else {
			console.log("`pass` executed successfully.")
		}
	} catch (ex) {
		console.error("Fuck")
		console.error(ex)
		result = {exitCode: -1}
	}
	return result;
}

exports.runPass = runPass

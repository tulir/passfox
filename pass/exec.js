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

/**
 * Run the Password Store script
 *
 * @param dir The password store directory.
 * @param extraArgs An array containing the arguments for pass.
 * @param callback The callback function to call after execution.
 */
function pass(args, env, callback) {
	let proc = child_process.spawn(env.SHELL, ["-c", "/usr/bin/pass " + args.join(" ")], {env: env})
	let stdout = ""
	let stderr = ""
	proc.stdout.on("data", data => stdout += data)
	proc.stderr.on("data", data => stderr += data)
	proc.on("close", code => callback(code, stdout, stderr))
}

function getValue(fullPath, key, env, callback) {
	pass(["show", fullPath], env, (status, data, err) => {
		let val = data.split("\n").find(line => {
			if (line.toLowerCase().startsWith(key + ": ")) {
				return true
			}
		})
		if (val !== undefined && val.length > (key + ": ").length) {
			val = val.substr((key + ": ").length)
		}
		callback(val, status, data, err)
	})
}

function copyPassword(fullPath, env, callback) {
	pass(["show", "-c", fullPath], env, callback)
}

exports.pass = pass
exports.getValue = getValue
exports.copyPassword = copyPassword

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
	let proc = child_process.spawn("/usr/bin/pass", args, {env: env})
	let stdout = ""
	let stderr = ""
	proc.stdout.on("data", data => stdout += data)
	proc.stderr.on("data", data => stderr += data)
	proc.on("close", code => callback(code, stdout, stderr))
}

function list(fullPath, env, callback) {
	pass(["list"], env, (status, data, err) => callback(data, err))
}

function get(fullPath, env, callback) {
	pass(["show", fullPath], env, (status, data, err) => callback(data, err))
}

function getValue(fullPath, keys, env, callback) {
	let realKeys = []
	if (typeof(keys) === "string") {
		realKeys.push(keys.toLowerCase() + ": ")
	} else {
		for (key of keys) {
			realKeys.push(key.toLowerCase() + ": ")
		}
	}
	pass(["show", fullPath], env, (status, data, err) => {
		for (line of data.split("\n")) {
			for (key of realKeys) {
				if (line.toLowerCase().startsWith(key)) {
					callback(line.substr(key.length), status, data, err)
					return
				}
			}
		}
		callback("", status, data, "Error: No " + keys[0].toLowerCase()
			+ " found from " + fullPath.substr(1) + "\n" + err)
	})
}

function getOTP(fullPath, env, callback) {
	pass(["otp", "--raw", fullPath], env, (status, data, err) => {
		lines = data.split("\n")
		callback(lines[0], lines[1], data, err)
	})
}

function getPassword(fullPath, env, callback) {
	pass(["show", fullPath], env, (status, data, err) => {
		callback(data.split("\n")[0], data, err)
	})
}

exports.get = get
exports.list = list
exports.getOTP = getOTP
exports.getValue = getValue
exports.getPassword = getPassword

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
 * Pass script execution module.
 *
 * @module pass/exec
 */
const child_process = require("sdk/system/child_process")
const { emit } = require("sdk/event/core")
const config = require("pass/config")

/**
 * The callback for functions that give stdout and stderr.
 *
 * @callback stdioCallback
 * @param {string} data The text from stdout.
 * @param {string} error The text from stderr.
 */

/**
 * The callback for {@link #pass}
 *
 * @callback passCallback
 * @param {string} status The return value.
 * @param {string} data The text from stdout.
 * @param {string} error The text from stderr.
 */

/**
 * Run the Password Store script
 *
 * @param {string[]} args An array containing the arguments for pass.
 * @param {passCallback} callback The function to call after execution.
 */
function pass(args, callback) {
	let proc = child_process.spawn(
		config.prefs.passExec, args, {env: config.environment}
	)
	let stdout = ""
	let stderr = ""
	proc.stdout.on("data", data => stdout += data)
	proc.stderr.on("data", data => stderr += data)
	proc.on("close", code => callback(code, stdout, stderr))
}

/**
 * Initialize the password store using for the given GPG key
 *
 * @param {string} key The key to give to `pass init`.
 * @param {function} callback The function to call after execution.
 */
exports.init = function(key, callback) {
	pass(["init", key], (status, data, err) => callback())
}

/**
 * Get the password store tree.
 *
 * @param {stdioCallback} callback The function to call after execution.
 */
exports.list = function(callback) {
	pass(["list"], (status, data, err) => callback(data, err))
}

/**
 * Get the contents of the password at the given path.
 *
 * @param {string} fullPath The path to get the password from.
 * @param {stdioCallback} callback The function to call after execution.
 */
exports.get = function(fullPath, callback) {
	pass(["show", fullPath], (status, data, err) => callback(data, err))
}

/**
 * Insert the given data into the password at the given path.
 *
 * @param {string} fullPath The path to the password.
 * @param {string} data The data to insert.
 * @param {function} callback The function to call after execution.
 */
exports.insert = function(fullPath, data, callback) {
	let proc = child_process.spawn(
		config.prefs.passExec,
		["insert", "--force", "--multiline", fullPath],
		{env: config.environment}
	)
	for (line of data.split("\n")) {
		emit(proc.stdin, "data", line)
	}
	emit(proc.stdin, 'end')
	proc.on("close", () => callback())
}

/**
 * The callback for {@link #getValue}
 *
 * @callback valueCallback
 * @param {string} value The value (empty if none found).
 * @param {string} error The text from stderr.
 */

/**
 * Get a specific keyed value from a password.
 *
 * @param {string} fullPath The path to get the data from.
 * @param {(string|string[])} keys A string or list containing the key or keys to match.
 * @param {valueCallback} callback The function to call after execution.
 */
exports.getValue = function(fullPath, keys, callback) {
	let realKeys = []
	if (typeof(keys) === "string") {
		realKeys.push(keys.toLowerCase() + ": ")
	} else {
		for (key of keys) {
			realKeys.push(key.toLowerCase() + ": ")
		}
	}
	pass(["show", fullPath], (status, data, err) => {
		for (line of data.split("\n")) {
			for (key of realKeys) {
				if (line.toLowerCase().startsWith(key)) {
					callback(line.substr(key.length), err)
					return
				}
			}
		}
		callback("", "Error: No " + keys[0].toLowerCase()
			+ " found from " + fullPath.substr(1) + "\n" + err)
	})
}

/**
 * The callback for {@link #getOTP}
 *
 * @callback otpCallback
 * @param {string} otp The one-time password. This is actually a number, but it shouldn't be handled as one.
 * @param {number} expiry The amount of seconds till the OTP expires.
 * @param {string} error The text from stderr.
 */

 /**
 * Get a one-time password for the password at the given path.
 *
 * @param {string} fullPath The path to get the OTP secret from.
 * @param {otpCallback} callback The function to call after execution.
 */
exports.getOTP = function(fullPath, callback) {
	pass(["otp", "--raw", fullPath], (status, data, err) => {
		let lines = data.split("\n")
		let otp = ""
		let expiry = 0
		if (lines.length > 1) {
			let otp = lines[0]
			let expiry = parseInt(lines[1])
		}
		callback(otp, expiry, err)
	})
}

/**
 * The callback for {@link #getPassword}
 *
 * @callback passwordCallback
 * @param {string} passwd The password.
 * @param {string} error The text from stderr.
 */

/**
 * Get the first line of the password at the given path.
 *
 * @param {string} fullPath The path to get the data from.
 * @param {otpCallback} callback The function to call after execution.
 */
exports.getPassword = function(fullPath, callback) {
	pass(["show", fullPath], (status, data, err) => {
		callback(data.split("\n")[0], err)
	})
}

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
 * Pass tree parsing and handling module.
 *
 * @module pass/store
 */

/**
 * Class containing every file name in the password store.
 */
class PasswordStore {
	/**
	 * Create a PasswordStore
	 */
	constructor() {
		this.store = new PasswordDirectory()
	}

	/**
	 * Get the section designated by the given array. If the section does not
	 * exist, it will be created.
	 *
	 * @param {PathTree} tree An array with the name of each section as a string.
	 * @return {PasswordDirectory} The tree map
	 */
	dynamicGet(tree) {
		let obj = this.store
		for(let i = 0; i < tree.length; i++) {
			if (!obj.hasOwnProperty(tree[i])) {
				obj[tree[i]] = new PasswordDirectory()
			}
			obj = obj[tree[i]]
		}
		return obj
	}

	/**
	 * Fix the top level object, since the tree always has "Password Store"
	 * as the first level. If the top level is not "Password Store", this will
	 * do nothing.
	 */
	fixTopLevel() {
		if (this.store.hasOwnProperty("Password Store")) {
			this.store = this.store["Password Store"]
		}
	}

	/**
	 * Parse a full Password Store tree.
	 *
	 * @param {string[]} lines Each line of the Password Store tree in an array.
	 */
	parseFull(lines) {
		var tree = new PathTree()
		for (let i = 0; i < lines.length; i++) {
			let rawLine = lines[i].replace(/\\+\s/g, " ")
			if (rawLine.length === 0) {
				// Ignore empty lines, they're nasty
				continue
			}
			// Get the actual content of the current line
			let line = rawLine.substr(firstLetterInLineOfTree(rawLine))

			let nextDepth = 0
			if (i + 1 < lines.length) {
				// Each section in an ASCII tree is always four characters
				// long, so this'll always return the right depth.
				//
				// If the next line is empty, the first letter is 0 so that
				// won't cause problems either.
				nextDepth = firstLetterInLineOfTree(lines[i+1]) / 4
			}

			if (nextDepth === tree.depth() + 1) {
				// If the depth of the next line is larger than the depth of
				// this line, this line must be a directory.
				tree.enter(line)
			} else {
				// If the depth of the next line is equal to or smaller than
				// the depth of this line, this line must be a regular password.
				this.dynamicGet(tree.raw()).addPassword(line)
			}

			// Exit to the depth of the next line. This only changes things
			// if the next line is at a lower depth than this line.
			tree.exitToDepth(nextDepth)
		}
		this.fixTopLevel()
	}

	/**
	 * Search for a password or directory in the password store.
	 *
	 * @param {string} query The search query.
	 * @return {Object[]} results The results of the query.
	 */
	search(query) {
		return this.store.search(query.toLowerCase(), new PathTree())
	}
}

/**
 * A part of a {@link #PasswordStore} containing info about everything in a
 * single directory.
 */
class PasswordDirectory {
	/**
	 * Add a password entry to this directory
	 *
	 * @param {string} name The file name of the password.
	 */
	addPassword(name) {
		this[name] = ""
	}

	/**
	 * Search for a password or directory in this directory.
	 *
	 * @param {string} query The search query.
	 * @param {PathTree} tree The location of this directory within the store.
	 */
	search(query, tree) {
		var results = []
		for (let key in this) {
			let newTree = tree.clone().enter(key)
			if (typeof(this[key]) === "string") {
				if (key.toLowerCase().indexOf(query) !== -1) {
					results.push({
						path: "/" + newTree.toString(),
						type: "password"
					})
				}
			} else if (newTree.toString().toLowerCase().indexOf(query) !== -1) {
				results.push({
					path: "/" + newTree.toString() + "/",
					type: "directory"
				})
			} else {
				results = results.concat(this[key].search(query, newTree))
			}
		}
		return results
	}
}

/**
 * Class for expressing a certain directory or password in a store.
 */
class PathTree {
	/**
	 * Create a PathTree
	 *
	 * @param {string[]} [arr] The path to start from.
	 */
	constructor(arr) {
		if (arr === undefined) {
			arr = []
		} else {
			arr = [].concat(arr)
		}
		this.tree = arr
	}

	/**
	 * Clone this PathTree.
	 *
	 * @return {PathTree} cloned An exact copy of the current state of this tree.
	 */
	clone() {
		return new PathTree(this.tree)
	}

	/**
	 * Enter the given section
	 *
	 * @param {string} section The section to enter
	 * @return {PathTree} this This object to allow chaining.
	 */
	enter(section) {
		this.tree[this.tree.length] = section
		return this
	}


	/**
	 * Exit out of the given number of sections.
	 *
	 * @param {number} numOfSections The number of sections to exit out of.
	 * @return {PathTree} this This object to allow chaining.
	 */
	exit(numOfSections) {
		this.exitToDepth(this.tree.length - numOfSections)
		return this
	}

	/**
	 * Exit to the given depth.
	 *
	 * @param {number} [depth] The depth to exit to.
	 * @return {PathTree} this This object to allow chaining.
	 */
	exitToDepth(depth) {
		if (depth === undefined) {
			depth = this.tree.length - 1
		}
		this.tree = this.tree.slice(0, depth)
		return this
	}

	/**
	 * @return {string} str a textual representation of this {@link #PathTree}.
	 */
	toString() {
		return this.tree.join("/")
	}

	/**
	 * @return {number} depth The current depth of this tree.
	 */
	depth() {
		return this.tree.length
	}

	/*
	 * @return {string[]} tree This tree as a string array.
	 */
	raw() {
		return this.tree
	}
}

function firstLetterInLineOfTree(str) {
	for(let i = 0; i < str.length; i++) {
		switch(str.charAt(i)) {
		case "|":
		case "-":
		case " ":
		case "`":
			continue
		default:
			return i
		}
	}
}

exports.PasswordStore = PasswordStore
exports.PasswordDirectory = PasswordDirectory
exports.PathTree = PathTree

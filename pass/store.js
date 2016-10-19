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
class PasswordStore {
    constructor() {
        this.store = new PasswordDirectory()
    }

    /**
     * Get the section designated by the given array. If the section does not
     * exist, it will be created.
     *
     * @param tree An array with the name of each section as a string.
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
     * as the first level.
     */
    fixTopLevel() {
        if (this.store.hasOwnProperty("Password Store")) {
            this.store = this.store["Password Store"]
        }
    }

    /**
     * Parse a full Password Store tree.
     *
     * @param lines Each line of the Password Store tree in an array.
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

    search(query) {
        return this.store.search(query.toLowerCase(), new PathTree())
    }
}

class PasswordDirectory {
    addPassword(name) {
        this[name] = ""
    }

    search(query, tree) {
        var results = []
        for (let key in this) {
            let newTree = tree.clone().enter(key)
            if (typeof(this[key]) === "string") {
                if (key.toLowerCase().indexOf(query) !== -1) {
                    results.push(newTree.toString())
                }
            } else {
                results = results.concat(this[key].search(query, newTree))
            }
        }
        return results
    }
}

class PathTree {
    constructor(arr) {
        if (arr === undefined) {
            arr = []
        } else {
            arr = [].concat(arr)
        }
        this.tree = arr
    }

    clone() {
        return new PathTree(this.tree)
    }

    enter(section) {
        this.tree[this.tree.length] = section
        return this
    }


    /**
     * Exit out of the given number of sections.
     *
     * @param numOfSections The number of sections to exit out of.
     */
    exit(numOfSections) {
        this.exitToDepth(this.tree.length - numOfSections)
        return this
    }

    /**
     * Exit to the given depth.
     *
     * @param depth The depth to exit to.
     */
    exitToDepth(depth) {
        if (depth === undefined) {
            depth = this.tree.length - 1
        }
        this.tree = this.tree.slice(0, depth)
        return this
    }

    toString() {
        return this.tree.join("/")
    }

    depth() {
        return this.tree.length
    }

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

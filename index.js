/**
 * Signs Updater For The Legend Of Zelda Oracle Of Ages/Seasons
 */
// Modules
const express = require("express");
const app = express();
const fs = require("fs");
const port = 80;
const path = require("path");
const yaml = require("yaml");
const exec  = require("child_process");
const shell = require("shelljs");
const https = require("https");
// functions
function getFilepathFromDisasmPath(p) { // gets the filepath from user input and os.
    const filepathbeg = process.platform == "win32" ? 'c:\\' : '/';
    return path.join(filepathbeg + p);
}
function createDirsIfNonExistant(filepath) { // creates non existant directories
    const filrpath = process.platform == "win32" ? "\\" : `/`;
    const split = filepath.split(filrpath);
    function c(d = 1) {
        const pathbuild = [];
        for (var i = 0; i < d; i++) pathbuild.push(split[i]);
        if (fs.existsSync(pathbuild.join(filrpath))) return c(d + 1);
        fs.mkdirSync(pathbuild.join(filrpath));
        if (d == split.length) return true;
        return c();
    }
    return !fs.existsSync(filepath) ? c() : true;
}
function convertAssemblyCode(signTextAssembly, query) { // converts assembly code from the signText.s file to a JSON output
    const assemblyJson = {};
    const stuff = signTextAssembly.substring(signTextAssembly.indexOf("Data:") - 14)
    const split = stuff.split(":");
    function assemblyConvert(c = 0) { // we are grinding up some gears
        if (split[c] && split[c + 1]) {
            const i = split[c].split("signText")[1]
            const d = split[c + 1].split(`\n\nsignTextGroup${c + 1}Data`)[0].split(`\nsignTextGroup${c + 1}Data`)[0].split("\n\t.db ");
            /*let d;
            switch (query.game) {
                case "ages": {
                    d = split[c + 1].split(`\n\nsignTextGroup${c + 1}Data`)[0].split(`\nsignTextGroup${c + 1}Data`)[0].split("\n\t.db ");
                    break;
                } case "seasons": {
                    console.log(split[c + 1].split());
                    d = split[c + 1].split("\n\t.db ")
                    d[d.length - 1] = "$00";
                    d = d.join('').split("\r")
                    break;
                }
            }*/
            d.splice(0, 1);
            assemblyJson[i] = d
            assemblyConvert(c + 1)
        }
    }
    // begin the convert
    assemblyConvert();
    return assemblyJson;
}
const functionsCallableFromBrowser = { // all functions that can be called from a client's web browser
    disasmFolderPathExists(query) { // checks to see if the oracles-disasm folder exists on the user's system and then returns a boolean
        const filepathbeg = process.platform == "win32" ? 'c:\\' : '/';
        const filepath = path.join(filepathbeg + query.disasmFolderPath);
        return fs.existsSync(filepath);
    }
}
// Set up the app
app.use((req, _, next) => { // log requests and ensure that this app is using localhost only.
    if (!req.headers.host.includes("localhost")) return res.send(
        'This app cannot be exposed to the public world. Please use this app on localhost.'
    )
    console.log(req.method, req.url);
    console.log(req.query);
    next();
}).use(express.static('./public')).post('/appPackage/:type', (req, res) => { // gets the package.json info for the user
    const package = JSON.parse(fs.readFileSync('./package.json'));
    if (req.params.type && package[req.params.type]) res.send(package[req.params.type]);
    else res.json(package);
}).post(`/oracles/api/LynnaLab/newProject/branchCheckout`, (req, res) => { // checks out a github branch using the project directory
    if (!fs.existsSync(req.query.dir)) res.json({ // throw out a secondary error if the project directory does not exist
        messageType: "secondary",
        text: `That's strange, it dosen't seem like that your project does not exist at file path ${
            req.query.dir
        }. Try making a new project again`
    });
    else { // if the project directory does exist, then we can proceed with the checkout
        exec.exec(`cd "${req.query.dir}" && git checkout "${req.query.name}"`, (error, stdout, stderr) => {
            if (error == null) { // if the checkout was successful
                const filrpath = process.platform == "win32" ? "\\" : `/`;
                const name = req.query.dir.substring(req.query.dir.lastIndexOf(filrpath) + 1);
                const oraclesDisasmRename = req.query.dir.split(name).join("oracles-disasm");
                if (!fs.existsSync(oraclesDisasmRename)) shell.mv(req.query.dir, oraclesDisasmRename);
                res.json({
                    messageType: "success",
                    text: stdout || `Successfuly checked out the ${req.query.name} branch in the ${req.query.dir} path.`
                });
            }
            else res.json({ // if the checkout was not successful
                messageType: "danger",
                text: error.toString(),
                moreContext: stderr
            });
        })
    }
}).post(`/oracles/api/LynnaLab/deleteProject`, (req, res) => { // deletes a project
    const filepath = getFilepathFromDisasmPath(req.query.dir);
    if (!fs.existsSync(filepath)) res.json({ // throw out a warning if the project directory does not exist
        messageType: "warning",
        text: `You can't delete your project if it does not exist at path ${
            filepath
        }. Please select a folder that your project actually exists on`
    });
    else { // if the project directory does exist, then we can proceed with the deletion
        shell.rm('-rf', filepath);
        if (fs.existsSync(filepath)) res.json({ // throw out some info if the project directory still exists
            messageType: "info",
            text: `Either Your project could not be deleted or not all project files were able to be removed successfuly from path ${
                filepath
            }. Please try deleting your project manually.`
        });
        else res.json({ // if the project directory was deleted successfuly
            messageType: "success",
            text: 'Your project has been deleted successfuly.'
        })
    }
}).post('/oracles/api/LynnaLab/newProject/startClone', async (req, res) => { // creates a new LynnaLab project for the user
    const filepath = getFilepathFromDisasmPath(req.query.cloneDirectory);
    if (!fs.existsSync(path.join(filepath, "./oracles-disasm"))) try { 
        // if the project directory does not exist, then we can proceed with the creation
        const jaon = await new Promise((res, rej) => { // generates an array using the data we have
            if (req.query.cloneURL.startsWith("https://github.com")) { // gets the branches from the repo using the github api
                let repoFullname = req.query.cloneURL.split("github.com/")[1];
                if (repoFullname.endsWith(".git")) repoFullname = repoFullname.slice(0, -4);
                if (repoFullname.includes("/tree/")) res({ // only include one item in the array if the user put /tree/ in the url
                    data: [
                        {
                            name: repoFullname.split("/tree/")[1],
                        }
                    ],
                    projectNewfolder: path.join(filepath, `./${repoFullname.split("/tree/")[0].split("/")[1]}`)
                });
                else https.get({ // gets the branches if said so otherwise.
                    hostname: "api.github.com",
                    path: `/repos/${repoFullname}/branches`,
                    headers: {
                        "User-Agent": "LynnaLab",
                    }
                }, r => { // converts the stream into a buffer
                    const buffers = [];
                    r.on("data", d => buffers.push(d)).on("end", () => { // uses the parsed json to generate the array
                        try { // 1st attempt (no second chances)
                            const data = JSON.parse(Buffer.concat(buffers));
                            res({
                                data: Array.isArray(data) ? data.filter(i => !i.protected) : data,
                                projectNewfolder: path.join(filepath, `./${repoFullname.split("/")[1]}`)
                            })
                        } catch (e) { // something went wrong
                            e.messageType = "danger";
                            e.errorMessage = e.toString()
                            e.outputResult = Buffer.concat(buffers).toString();
                            rej(e);
                        }
                    })
                }).on("error", e => { // if the request fails, then we throw an error
                    e.messageType = "danger";
                    e.errorMessage = e.toString();
                    rej(e);
                })
            }
        });
        if (
            createDirsIfNonExistant(filepath) 
            && Array.isArray(jaon.data)
        ) { // only clone the repo if the project directory exists and the data is an array
            // creates a command before we do anything
            const cloneURL = req.query.cloneURL.includes("/tree/") ? req.query.cloneURL.split("/tree/")[0] : req.query.cloneURL;
            const endFile = process.platform == "win32" ? `bat` : `sh`;
            const command = process.platform == "win32" ? `%@Try%\n\tcd "${filepath}"\n\tgit clone ${
                cloneURL
            }\n\texit\n%@EndTry%\n:@Catch\n\texit\n:@EndCatch` : `cd "${filepath}"\ngit clone ${
                cloneURL
            }\nsleep 1`
            fs.writeFileSync(`gitClone.${endFile}`, command);
            // executes the gitClone file with our command inside.
            exec.execSync(`${process.platform == "win32" ? 'start ' : './'}gitClone.${endFile}`);
            // removes the file after execution
            fs.unlinkSync(`gitClone.${endFile}`)
        }
        res.json(jaon);
    } catch (e) { // something went wrong
        console.log(e);
        res.json(e);
    } else res.json({ // throws a warning if the project exists
        messageType: "warning",
        errorMessage: `Your oracles disasm project for LynnaLab already exists in path ${
            filepath
        }. Please use the move or copy project to another directory feature under LynnaLab options and try again.`
    })
}).post('/oracles/api/LynnaLab/projectAction/moveOrCopy/command/:command', (req, res) => { // moves or copies the project using a command
    const newPath = getFilepathFromDisasmPath(req.query.newPath);
    if (createDirsIfNonExistant(newPath.substring(0, newPath.lastIndexOf(process.platform == "win32" ? "\\" : "/")))) {
        // only execute the command if the new path exists
        shell[req.params.command](req.params.command == "cp" ? '-r' : '-f', getFilepathFromDisasmPath(req.query.oldPath), newPath);
        if (fs.existsSync(newPath)) res.json({ // the command was successful
            messageType: "success",
            text: `The ${req.params.command} command has been executed successfully.`
        });
        else res.json({ // the command failed
            messageType: "danger",
            text: `The ${req.params.command} command has failed to execute.`
        });
    }
}).post('/oracles/api/functions/call/:functionName', (req, res) => { // calls a function using a client's browser
    const value = functionsCallableFromBrowser[req.params.functionName](req.query);
    res.end(typeof value == "boolean" ? value ? '1' : '0' : typeof value == "number" ? value.toString() : value)
}).post('/oracles/api/signText/add', (req, res) => { // Allows the user to add their own sign with their own text without modifying files
    // core varaibles
    const letters = [
        'a',
        'b',
        'c',
        'd',
        'e',
        'f'
    ]
    const prefix = 'TX_2e';
    // peform some checks before doing stuff
    if (process.platform == "darwin") res.json({ // MacOS isn't supported. So just throw out an error.
        msg: "MacOS Is Not Supported. Please try using a different opperating system",
        color: "red"
    });
    else { // run this process on windows and linux
        if (!functionsCallableFromBrowser.disasmFolderPathExists(req.query)) return res.json({ 
            // the oracles-disasm folder does not exist on the user's selected path of their system
            msg: "Sorry, but you are required to have the oracles-disasm folder somewhere in your system in order to\
             update the text in signs.",
            color: "red"
        });
        if (req.query.signPosition.length < 2 || req.query.roomIndex.length < 3) res.json({ // all fields are less than the required length
            msg: "Some fields do not have their input filled to their maximum length.\
             Please fill those fields to the maximum length in order for your changes to work correctly.",
            color: 'red'
        })
        else try { // finally, we are getting close. we just need to check for existance of the text.yaml and signText.s files.
            const filepath = getFilepathFromDisasmPath(req.query.disasmFolderPath);
            const textPath = path.join(filepath, `./text/${req.query.game}/text.yaml`);
            const signTextAssemblyPath = path.join(filepath, `./data/${req.query.game}/signText.s`);
            if (fs.existsSync(textPath) && fs.existsSync(signTextAssemblyPath)) { // we have existance for both files.
                // adds data to the text.yaml file by converting it to a json output and inputting user data to it.
                const textJson = yaml.parse(fs.readFileSync(textPath, 'utf8'));
                const writeTo = textJson.groups.find(i => i.group == 46);
                const lastWritten = writeTo.data[writeTo.data.length - 1];
                const index = lastWritten.index + 1;
                const data = {};
                const name = lastWritten.name;
                for (var i = 0; i < letters.length - 1; i++) {
                    if (data.name) break;
                    if (!letters[i + 1]) break;
                    const letter = letters[i];
                    if (!name.endsWith(letter)) continue;
                    data.name = name.slice(0, -1) + letters[i + 1];
                }
                if (!data.name) {
                    const number = Number(name.substr(5));
                    if ((number + 1).toString().endsWith('0')) data.name = `${prefix}${number.toString().slice(0, -1)}a`;
                    else data.name = `${prefix}${number + 1}`;
                }
                if (data.name) {
                    data.index = index;
                    data.text = req.query.signText || "No text";
                    writeTo.data[index] = data;
                    writeTo.data = writeTo.data.filter(i => i != null);
                    fs.writeFileSync(textPath, yaml.stringify(textJson));
                } else return res.json({
                    msg: 'Something went wrong while creating your sign. Please try again later.',
                    color: 'red'
                })
                // adds data to the signText.s file by inputting the user's custom sign value into it.
                const group = req.query.roomIndex.slice(0, -2);
                var signTextAssembly = fs.readFileSync(signTextAssemblyPath, 'utf8');
                const signTextAssemblyGroup = signTextAssembly.split(`signTextGroup${
                    group
                }Data:`)[1].split(`signTextGroup${
                    group + 1
                }Data:`)[0];
                console.log(signTextAssemblyGroup);
                signTextAssembly = signTextAssembly.replace(signTextAssemblyGroup, signTextAssemblyGroup.replace(".db $00", `.db $${
                    req.query.signPosition
                }, $${req.query.roomIndex.toLowerCase().substr(1)}, <${data.name}\n\t.db $00`));
                fs.writeFileSync(signTextAssemblyPath, signTextAssembly);
                // the operation was successful.
                res.json({
                    msg: "The operation was successful. Try testing the game on LynnaLab to see the results.",
                    color: 'green'
                })
            } else { // very dissapointing to see both files not existing.
                res.json({ // the oracles-disasm folder does not exist on the user's selected path of their system
                    msg: "Sorry, but either the signText.s or text.yaml files for " + req.query.game + " do not exist on your system. \
                    Are you sure that you selected the correct folder?",
                    color: "red"
                });
            }
        } catch (e) { // an error occured
            console.log(e);
            res.json({
                msg: e.toString(),
                color: "red"
            })
        }
    }
}).post('/oracles/api/signText/list', (req, res) => { // lists all signs based off of game choice and user's oracles disasm folder location
    if (!req.query.disasmFolderPath) res.json({
        callFunction: "disasmFolderPathRequired"
    }) 
    else { // user sent their oracles disasm folder to the path
        const filepath = getFilepathFromDisasmPath(req.query.disasmFolderPath);
        const textPath = path.join(filepath, `./text/${req.query.game}/text.yaml`);
        const signTextAssemblyPath = path.join(filepath, `./data/${req.query.game}/signText.s`);
        // the text.yaml file is found for listing
        if (fs.existsSync(textPath)) {
            const json = yaml.parse(fs.readFileSync(textPath, 'utf-8'));
            const read = json.groups.find(i => i.group == 46);
            const array = [];
            // loads the signText.s assembly file to cut down on signs that will break the game if edited with this app.
            if (!fs.existsSync(signTextAssemblyPath).toString()) return res.json({ // the file does not exist
                callFunction: "disasmFolderPathSelectErrorMessage",
                functionParams: `The signText.s file for ${
                    req.query.game
                } could not be found in the oracles disasm folder you provided. Please try selecting a diffrent folder.`
            })
            // continue executing the code if the file exists
            const signTextAssembly = fs.readFileSync(signTextAssemblyPath).toString();
            const arra = signTextAssembly.split("signTextGroup").join(" ").split("\n\t.db ");
            for (const i of read.data) {
                if (Array.isArray(i.name)) continue;
                const c = arra.filter(d => d.endsWith(i.name));
                if (c.length > 1) continue;
                array.unshift(i);
            }
            res.json({
                data: array.reverse()
            });
        } else res.json({ // the file does not exist
            callFunction: "disasmFolderPathSelectErrorMessage",
            functionParams: `The text.yaml file for ${
                req.query.game
            } could not be found in the oracles disasm folder you provided. Please try selecting a diffrent folder.`
        })
    }
}).post('/oracles/api/texts/list', (req, res) => { // lists all texts based off of game choice and user's oracles disasm folder location
    if (!req.query.disasmFolderPath) res.json({
        callFunction: "disasmFolderPathRequired"
    }) 
    else { // user sent their oracles disasm folder to the path
        const filepath = getFilepathFromDisasmPath(req.query.disasmFolderPath);
        const textPath = path.join(filepath, `./text/${req.query.game}/text.yaml`);
        // the text.yaml file is found for listing
        if (fs.existsSync(textPath)) {
            const json = yaml.parse(fs.readFileSync(textPath, 'utf-8'));
            const read = json.groups;
            // we don't want to update sign text as that's for a different page
            read.splice(read.findIndex(i => i.group == 46), 1);
            res.json({
                data: read
            });
        } else res.json({ // the file does not exist
            callFunction: "disasmFolderPathSelectErrorMessage",
            functionParams: `The text.yaml file for ${
                req.query.game
            } could not be found in the oracles disasm folder you provided. Please try selecting a diffrent folder.`
        })
    }
}).post('/oracles/api/texts/update', (req, res) => { // updates text from user input
    try {
        const filepath = getFilepathFromDisasmPath(req.query.disasmFolderPath);
        const textPath = path.join(filepath, `./text/${req.query.game}/text.yaml`);
        const json = yaml.parse(fs.readFileSync(textPath, 'utf-8'));
        const group = json.groups.find(i => i.group == req.query.group);
        const info = group.data.find(i => i.name == req.query.name);
        info.text = req.query.text || "No text"; 
        fs.writeFileSync(textPath, yaml.stringify(json));
        res.json({
            messageType: "success",
            text: `The Text For Group #${group.group} has been updated successfuly!`
        });
    } catch (e) {
        console.log(e);
        res.json({
            messageType: "danger",
            text: e.toString()
        })
    }
}).post('/oracles/api/signText/get', (req, res) => { // gets infomation about a specific sign using assembly and yaml code.
    const filepath = getFilepathFromDisasmPath(req.query.disasmFolderPath);
    const textPath = path.join(filepath, `./text/${req.query.game}/text.yaml`);
    const signTextAssemblyPath = path.join(filepath, `./data/${req.query.game}/signText.s`);
    if (fs.existsSync(textPath) && fs.existsSync(signTextAssemblyPath)) { // we have existance for both files.
        const json = yaml.parse(fs.readFileSync(textPath, 'utf-8'));
        // converts assembly code into a json output
        const assemblyJson = convertAssemblyCode(fs.readFileSync(signTextAssemblyPath, 'utf8'), req.query);
        const info = json.groups.find(i => i.group == 46).data.find(i => i.name == req.query.name);
        for (const a in assemblyJson) { // loops around the converted assembly json output to find the sign position and room number
            const groupNum = a.split("Group")[1].split("Data")[0];
            const asemblyInfo = assemblyJson[a].find(i => i.endsWith(info.name));
            if (!asemblyInfo) continue;
            const [signPosition, roomIndex] = asemblyInfo.split(",");
            info.signPosition = signPosition.substr(1);
            info.roomIndex = groupNum + roomIndex.substr(2);
        }
        // Operation Successful
        res.json(info)
    } else res.json({ // the oracles-disasm folder does not exist on the user's selected path of their system
        msg: "Sorry, but either the signText.s or text.yaml files for " + req.query.game + " do not exist on your system. \
        Are you sure that you selected the correct folder?",
        color: "red"
    });
}).post('/oracles/api/signText/update/:signPosition/:roomIndex/:name', (req, res) => { // Allows the user to update the text on an existing sign without modifying files
    // peform some checks before doing stuff
    if (process.platform == "darwin") res.json({ // MacOS isn't supported. So just throw out an error.
        msg: "MacOS Is Not Supported. Please try using a different opperating system",
        color: "red"
    });
    else { // run this process on windows and linux
        if (!functionsCallableFromBrowser.disasmFolderPathExists(req.query)) return res.json({ 
            // the oracles-disasm folder does not exist on the user's selected path of their system
            msg: "Sorry, but you are required to have the oracles-disasm folder somewhere in your system in order to \
            update the text in signs.",
            color: "red"
        });
        if (req.query.signPosition.length < 2 || req.query.roomIndex.length < 3) res.json({ // all fields are less than the required length
            msg: "Some fields do not have their input filled to their maximum length. Please fill those fields to the maximum length\
             in order for your changes to work correctly.",
            color: 'red'
        })
        else try { // finally, we are getting close. we just need to check for existance of the text.yaml and signText.s files.
            const filepath = getFilepathFromDisasmPath(req.query.disasmFolderPath);
            const textPath = path.join(filepath, `./text/${req.query.game}/text.yaml`);
            const signTextAssemblyPath = path.join(filepath, `./data/${req.query.game}/signText.s`);
            if (fs.existsSync(textPath) && fs.existsSync(signTextAssemblyPath)) { // we have existance for both files.
                // adds data to the text.yaml file by converting it to a json output and inputting user data to it.
                const textJson = yaml.parse(fs.readFileSync(textPath, 'utf8'));
                const info = textJson.groups.find(i => i.group == 46);
                const data = info.data.find(i => i.name == req.params.name);
                data.text = req.query.signText || "No text";
                fs.writeFileSync(textPath, yaml.stringify(textJson));
                // adds data to the signText.s file by inputting the user's custom sign value into it.
                const newGroup = req.query.roomIndex.slice(0, -2);
                const oldGroup = req.params.roomIndex.slice(0, -2);
                let signTextAssembly = fs.readFileSync(signTextAssemblyPath, 'utf8')
                if (newGroup == oldGroup) signTextAssembly = signTextAssembly.replace( // if both groups are equal
                    `.db $${req.params.signPosition}, $${req.params.roomIndex.substr(1)}, <${req.params.name}`, 
                    `.db $${req.query.signPosition}, $${req.query.roomIndex.toLowerCase().substr(1)}, <${req.params.name}`
                ); 
                else { // if both groups are not equal
                    signTextAssembly = signTextAssembly.replace(
                        `.db $${req.params.signPosition}, $${req.params.roomIndex.substr(1)}, <${req.params.name}`, 
                        ``
                    ); 
                    signTextAssembly = signTextAssembly.replace(`signTextGroup${newGroup}Data:`, `signTextGroup${
                        newGroup
                    }Data:\n\t.db $${req.query.signPosition}, $${req.query.roomIndex.toLowerCase().substr(1)}, <${req.params.name}`)
                }
                fs.writeFileSync(signTextAssemblyPath, signTextAssembly);
                // the operation was successful.
                res.json({
                    msg: "The operation was successful. Try testing the game on LynnaLab to see the results.",
                    color: 'green'
                })
            } else { // very dissapointing to see both files not existing.
                res.json({ // the oracles-disasm folder does not exist on the user's selected path of their system
                    msg: "Sorry, but either the signText.s or text.yaml files for " + req.query.game + " do not exist on your system. \
                    Are you sure that you selected the correct folder?",
                    color: "red"
                });
            }
        } catch (e) { // an error occured
            console.log(e);
            res.json({
                msg: e.toString(),
                color: "red"
            })
        }
    }
}).post('/oracles/api/signText/delete/:name', (req, res) => { // allows the user to remove their own text from their sign if needed.
    const filepath = getFilepathFromDisasmPath(req.query.disasmFolderPath);
    const textPath = path.join(filepath, `./text/${req.query.game}/text.yaml`);
    const signTextAssemblyPath = path.join(filepath, `./data/${req.query.game}/signText.s`);
    if (fs.existsSync(textPath) && fs.existsSync(signTextAssemblyPath)) try { // both files exist
        // removes user text from the text.yaml file
        const stuff = yaml.parse(fs.readFileSync(textPath, 'utf8'));
        const stuff1 = stuff.groups.find(i => i.group == 46);
        const info = stuff1.data.find(i => i.name == req.params.name);
        const index = stuff1.data.findIndex(i => i.name == req.params.name);
        if (index == stuff1.data.length - 1) { 
            // The user's text is the last one on the list (Deleting sign text this way helps prevent breaking the user's rom hack)
            stuff1.data.splice(index, 1);
            fs.writeFileSync(textPath, yaml.stringify(stuff));
            let signTextAssembly = fs.readFileSync(signTextAssemblyPath, 'utf8');
            const assemblyJson = convertAssemblyCode(signTextAssembly, req.query);
            for (const i in assemblyJson) {
                const line = assemblyJson[i].find(d => d.endsWith(info.name));
                if (!line) continue;
                signTextAssembly = signTextAssembly.replace(`.db ${line}`, '');
            }
            fs.writeFileSync(signTextAssemblyPath, signTextAssembly);
            res.json({ // things went well
                success: true,
                msg: 'The Sign Text was deleted successfuly! Try checking out the results on LynnaLab.'
            })
        } else res.json({ // in order to not break a game, thorw out a failsafe error
            success: false,
            msg: "Your sign could not be deleted because it isn't the last one you selected. This failsafe kicks in to prevent this app from breaking your rom hack of Zelda Oracle of Ages/Seasons after sign text removal."
        })
    } catch (e) {
        console.log(e);
        res.json({
            success: false,
            msg: e.toString()
        })
    }
}).listen(port, async () => { // Listen to the server
    console.log("App is running on port " + port);
    exec.execSync(`start http://localhost${port != 80 ? `:${port}` : ''}`)
});

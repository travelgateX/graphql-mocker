module.exports = {
    main: main
};

const fs = require('fs');
const { printMergeHelp } = require('./help')

//Saved split types
const types = ["commons", "interfaces", "objects", "inputs", "scalars", "enums"];
//Extendible types
const extendibles = ["Query", "Mutation", "Search", "Quote", "Booking"];
var extendedTypes = {};

function main(splitPath, outputPath, overWrite, avoidExtendibles) {
    //If --h/--help, show help and exit
    if (splitPath === "--h" || splitPath === "--help") {
        printMergeHelp();
        return;
    }
    //If no arguments, print message and return
    if (!splitPath) {
        console.error('Please, introduce the path containing the splitted schemas to merge as first argument.');
        return;
    }

    extendedTypes = {}; //Dictionary where extended types will be stored

    //Path check and instantiation
    var path;
    splitPath = (splitPath.substr(splitPath.length - 1) === "/") ? splitPath : splitPath + "/"
    if (outputPath) path = (outputPath.substr(outputPath.length - 1) === "/") ? outputPath : outputPath + "/";
    else path = splitPath;
    var outputFilePath = path + "merged_schema.graphql";
    if (fs.existsSync(outputFilePath) && overWrite != "false") fs.unlinkSync(path + "merged_schema.graphql");

    //Traverse all possible types and write non-extendible definitions
    var len = types.length;
    for (var i = 0; i < len; i++) {
        var typePath = splitPath + types[i] + "/";
        if (!fs.existsSync(typePath)) continue;
        if (!appendDefinitions(typePath, outputFilePath, avoidExtendibles)) return;
    }

    //Write extendible definitions (if there is any)
    if (avoidExtendibles === "true") {
        extendibles.forEach(function (item) {
            if (extendedTypes[item]) {
                //Merge file
                fs.appendFileSync(outputFilePath, extendedTypes[item].join("\n") + "\n");
            }
        });
    }

    console.log("Files successfuly merged at " + outputFilePath);

    return extendedTypes;
}

//Deprecated
function appendDefinitions(inPath, outFilePath, avoidExtendibles) {
    //Get file names
    var names = fs.readdirSync(inPath);

    //Iterate through folder files
    names.forEach(function (file) {
        if (file.endsWith(".graphql")) {
            var content = fs.readFileSync(inPath + file, 'utf-8');
            var fileLines = content.toString().split('\n');

            //Iterate until first significant line
            for (var i = 0; i < fileLines.length; i++) {
                var line = fileLines[i];
                if (line.length <= 1) continue; //Remove empty lines
                var split = line.split(' ');
                if (!split[1]) continue;
                var keyWord = split[0].trim();
                var itemName = split[0] === "extend" ? split[2].trim() : split[1].trim();

                //Fix possible not separated keys
                if (itemName.substr(itemName.length - 1) == "{") itemName = itemName.substr(0, itemName.length - 1);

                //If "extend" found, extend type
                if (keyWord === "extend" && extendibles.indexOf(itemName) <= -1) {
                    console.log("ERROR: Trying to extend an XTG non extendible type (" + itemName + ").");
                    return false;

                } else if (keyWord === "extend" || (extendibles.indexOf(itemName) > -1)) {
                    var value = extendedTypes[itemName];
                    value = fileLines;                                                                      //Add as complete definition
                    if (avoidExtendibles != "true") value[i] = value[i].replace("extend", "");              //Remove "extend" keyword
                    extendedTypes[itemName] = value;
                    break;

                } else if (keyWord === "#") {
                    continue;

                } else {
                    //Merge file
                    fs.appendFileSync(outFilePath, content + "\n");
                    break;
                }
            }
        }
    });
    return true;
}
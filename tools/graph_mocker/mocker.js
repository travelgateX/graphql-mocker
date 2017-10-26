module.exports = {
    main: main
}

const splitter = require('../schema_splitter/splitter').main;
const merger = require('../schema_merger/merger').main;
const faker = require('../graph_faker/gr_faker').main;
const { printMockerHelp } = require('./help');
const { join } = require('path');
const fs = require('fs');

//Extendible types
var extendibles = ["Query", "Mutation", "Search", "Quote", "Booking"];
var extendedTypes = {};

//1. Merge schema/s
//2. Fake merged schema
//OPTIONAL: If any API was specified:
//  3. Merge API schema
//  4. Fake API schema extending merged schema

function main(path, apiName) {
    if (!path) { console.log("ERROR: No path was provided."); return; }
    //If --h/--help, show help and exit
    if (path === "--h" || path === "--help") {
        printMockerHelp();
        return;
    }

    //Prepare/Check path
    path = (path.endsWith("/")) ? path : path + "/"; //Add "/" if necessary to avoid furture appends
    if (!fs.existsSync(path)) { console.log("ERROR: Could not find path " + path); return; }
    if (fs.existsSync(path + "merged_schema.graphql")) fs.unlinkSync(path + "merged_schema.graphql");


    //1. Merge schema/s
    //Iterate through all APIs except the named and merge them
    var apiPath = path + apiName + "/";
    var isDirectory = source => fs.lstatSync(source).isDirectory();
    var getDirectories = source => fs.readdirSync(source).map(name => join(source, name)).filter(isDirectory)

    //Iterate through directories (merger will collide all .graphql schemas within every directory that are on the split format, if any)
    var dirs = getDirectories(path);
    dirs.forEach(function (dir) {
        dir = "./" + dir.replace('\\', '/') + "/";
        if (dir !== apiPath) {
            //Merge schema
            var extensions = merger(dir, path, "false", "true");

            //Look for extendible definitions and extend them if proceeds 
            updateExtendibles(extensions);
        }
    });

    writeExtendibles(path + "merged_schema.graphql");

    console.log("Schemas merged.");


    //2. Fake merged schema
    faker(path + "merged_schema.graphql", callback);
    console.log("General schema raised on faker. --> Editor URL: http://localhost:9002/editor")

    if (apiName) {
        //3. Merge API schema
        merger(apiPath);

        //4. Fake API schema extending merged schema
        faker(apiPath + "merged_schema.graphql", callback, "9003", "http://localhost:9002/graphql");
        console.log("Extended API raised on faker. --> Editor URL: http://localhost:9003/editor")
    }

    console.log("\n\nREMEMBER: To save your work, make sure to save it on Faker and run 'save' Mocker's command before commit.");
}


function updateExtendibles(extensions) {
    Object.keys(extensions).forEach(function (i) {
        if (extendedTypes[i]) {
            //Merge definitions
            var value = extendedTypes[i];
            var j = countLinesUntilDefinition(extensions[i]);
            value.splice(-2, 2);                                                   //Remove "}"
            extendedTypes[i] = value.concat(extensions[i].slice(j, extensions[i].length));    //Add new definition except definition line.
        } else extendedTypes[i] = extensions[i];
    })
}


function countLinesUntilDefinition(value) {
    var count = 0;
    var len = value.length;
    for (; count < len; count++) {
        var line = value[count];
        if (line.length <= 1 || !line.split(' ')[1] || line.startsWith("#")) continue;
        else break;
    }

    return ++count;
}


function writeExtendibles(path) {
    Object.keys(extendedTypes).forEach(function (i) {
        //Merge file
        fs.appendFileSync(path, extendedTypes[i].join("\n") + "\n");
    });
}


function callback(text) {
    console.log(text);
}
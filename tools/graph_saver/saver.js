module.exports = {
    main: main
}

const splitter = require('../schema_splitter/splitter').main;
const { printSaverHelp } = require('./help');
const { join } = require('path');
const fs = require('fs');

function main(path) {
    if (!path) { console.log("ERROR: No path was provided."); return; }
    //If --h/--help, show help and exit
    if (path === "--h" || path === "--help") {
        printSaverHelp();
        return;
    }

    //Prepare/Check path
    path = (path.endsWith("/")) ? path : path + "/"; //Add "/" if necessary to avoid furture appends
    if (!fs.existsSync(path)) { console.log("ERROR: Could not find path " + path); return; }
    if (fs.existsSync(path + "merged_schema.graphql")) fs.unlinkSync(path + "merged_schema.graphql");


    //Get directories
    var isDirectory = source => fs.lstatSync(source).isDirectory();
    var getDirectories = source => fs.readdirSync(source).map(name => join(source, name)).filter(isDirectory)
    var dirs = getDirectories(path);

    //Iterate through directories splitting all merged schemas and deleting them
    dirs.forEach(function (dir) {
        dir = "./" + dir + "/";
        var schemaPath = dir + "merged_schema.graphql";
        if (fs.existsSync(schemaPath)) {
            
            splitter(schemaPath, dir);      //Split schema
            fs.unlinkSync(schemaPath);      //Remove merged
        }
    });
    console.log("Schemas splitted.");
}
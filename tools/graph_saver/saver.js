module.exports = {
    main: main
}

const splitter = require('../schema_splitter/splitter').main;
const { printSaverHelp } = require('./help');
const { join, basename } = require('path');
const fs = require('fs');

function main(path, apiName) {
    if (!path) { console.log("ERROR: No path was provided."); return; }
    //If --h/--help, show help and exit
    if (path === "--h" || path === "--help") {
        printSaverHelp();
        return;
    }

    //Prepare/Check path
    path = (path.endsWith("/")) ? path : path + "/"; //Add "/" if necessary to avoid furture appends
    if (!fs.existsSync(path)) { console.log("ERROR: Could not find path " + path); return; }
    if (fs.existsSync(path + "merged_schema.graphql")) {
        var schemaPath =path+ "merged_schema.graphql"
        splitter(schemaPath, path);      //Split schema
        fs.rename(schemaPath,path + "/merged_schema."+Date.now())
        // fs.unlinkSync(path + "merged_schema.graphql");
    }


    //Get directories
    var isDirectory = source => fs.lstatSync(source).isDirectory();
    var getDirectories = source => fs.readdirSync(source).map(name => join(source, name)).filter(isDirectory)
    var dirs = getDirectories(path);

    //Iterate through directories splitting all merged schemas and deleting them
    dirs.forEach(function (dir) {
        //Check if API Name specified and in that case only save that API
        if (!apiName || apiName === basename(dir)) {
            dir = "./" + dir;
            console.log(dir);

            var schemaPath = dir + "/merged_schema.graphql";
            if (fs.existsSync(schemaPath)) {
                splitter(schemaPath, dir);      //Split schema
                fs.rename(schemaPath,dir + "/merged_schema."+Date.now())
                // fs.unlinkSync(schemaPath);      //Remove merged
            }
        }
    });
    console.log("Schemas splitted.");
}

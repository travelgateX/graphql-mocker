module.exports = {
    main: main
}

const splitter = require('../schema_splitter/splitter').main;
const merger = require('../schema_merger/merger').main;
const faker = require('../graph_faker/gr_faker').main;
const { printMockHelp } = require('./help');
const { join } = require('path');
const fs = require('fs');


//1. Merge schema/s
//2. Fake merged schema
//OPTIONAL: If any API was specified:
//  3. Merge API schema
//  4. Fake API schema extending merged schema

function main(path, apiName) {
    if (!path) { console.log("ERROR: No path was provided."); return; }
    //If --h/--help, show help and exit
    if (path === "--h" || path === "--help") {
        printMockHelp();
        process.exit(0);
    }

    //Prepare/Check path
    path = (path.endsWith("/")) ? path : path + "/"; //Add "/" if necessary to avoid furture appends
    if (!fs.existsSync(path)) { console.log("ERROR: Could not find path " + path); return; }
    if(fs.existsSync(path + "merged_schema.graphql")) fs.unlinkSync(path + "merged_schema.graphql");


    //1. Merge schema/s
    //Iterate through all APIs except the named and merge them
    var apiPath = path + apiName + "/";
    var isDirectory = source => fs.lstatSync(source).isDirectory();
    var getDirectories = source => fs.readdirSync(source).map(name => join(source, name)).filter(isDirectory)

    //Iterate through directories (merger will collide all .graphql schemas within every directory that are on the split format, if any)
    var dirs = getDirectories(path);
    dirs.forEach(function (dir) {
        dir = "./" + dir.replace('\\', '/') + "/";
        if (dir !== apiPath) merger(dir, path, "false");
    });
    console.log("Schemas merged.");


    //2. Fake merged schema
    faker(path + "merged_schema.graphql", callback);

    //3. Merge API schema
    merger(apiPath);

    //4. Fake API schema extending merged schema
    faker(apiPath + "merged_schema.graphql", callback, "9003", "http://localhost:9002/graphql");

}

function callback(text) {
    console.log(text);
}
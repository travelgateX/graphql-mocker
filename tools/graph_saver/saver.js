module.exports = {
    main: main
}

const splitter = require('../schema_splitter/splitter').main;
const { printSaverHelp } = require('./help');
const path = require('path');
const fs = require('fs');

/**
 * Split the schema into multiple files and save depends of type
 * 
 * @param {folder where there should be a merged_schema} _path 
 */
function main(_path) {
    if (!_path) { console.log("ERROR: No path was provided."); return; }
    //If --h/--help, show help and exit
    if (_path === "--h" || _path === "--help") {
        printSaverHelp();
        return;
    }

    //Prepare/Check path
    _path = (_path.endsWith(path.sep)) ? _path : _path + path.sep; //Add "/" if necessary to avoid furture appends
    if (!fs.existsSync(_path)) { console.log("ERROR: Could not find path " + _path); return; }
    var schemaPath =_path+ "merged_schema.graphql"
    if (fs.existsSync(schemaPath)) {
        splitter(schemaPath, _path);      //Split schema
        fs.renameSync(schemaPath,_path + "/merged_schema."+Date.now())
        console.log("Schemas splitted.");
    }else{
        console.log("File " + schemaPath);
    }

}

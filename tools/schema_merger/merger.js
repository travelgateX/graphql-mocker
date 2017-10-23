module.exports = {
    main: main
};

const fs = require('fs');
const { printMergeHelp } = require('./help')

function main(splitPath, outputPath, overWrite) {
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
    //Path check and instantiation
    var path;
    splitPath = (splitPath.substr(splitPath.length - 1)   === "/") ? splitPath  : splitPath  + "/"
    if (outputPath) path = (outputPath.substr(outputPath.length - 1) === "/") ? outputPath : outputPath + "/";
    else path = splitPath;
    var outputFilePath = path + "merged_schema.graphql";
    if (fs.existsSync(outputFilePath) && overWrite != "false") fs.unlinkSync(path + "merged_schema.graphql");

    //Saved split types
    var types = ["commons", "interfaces", "objects", "inputs", "scalars", "enums"];

    //Traverse all possible types
    var len = types.length;
    for (var i = 0; i < len; i++) {
        var typePath = splitPath + types[i] + "/";
        if (!fs.existsSync(typePath)) continue;
        appendDefinitions(typePath, outputFilePath);
    }

    console.log("Files successfuly merged at " + path + "merged_schema.graphql");
}


function appendDefinitions(inPath, outFilePath) {
    //Get file names
    var names = fs.readdirSync(inPath);

    //Iterate through folder files
    names.forEach(function (file) {
        if (file.endsWith(".graphql"));
        //Append all files
        fs.appendFileSync(outFilePath, fs.readFileSync(inPath + file, 'utf-8') + "\n");
    });
}
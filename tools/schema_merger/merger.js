module.exports = {
    main: main,
    mergeAST: mergeAST
};

const convertLegacyDescriptions = require('../schema_splitter/splitter').convertLegacyDescriptions;
const fs = require('fs');
const { printMergeHelp } = require('./help')
const graphqllang= require('graphql/language');
const graphql= require('graphql');
//Saved split types
const types = ["commons", "interfaces", "objects", "inputs", "scalars", "enums"];
//Extendible types
var sourceFile = require('../../sourceFile');
var extendibles = sourceFile.extendibles;
var extendedTypes = {};

function mergeAST(dirs,outputPath, overWrite){
    var completeAST=null;
    dirs.forEach(function (dir) {
        //Get directory name for comparison
        
        console.log("Proceeding to merge schema at " + dir)
        var partialAST = main(dir, outputPath, overWrite);
        if (partialAST){
            completeAST = completeAST!==null?graphql.concatAST([completeAST, partialAST]):partialAST;
        }
        
    });
    return completeAST;
}

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

    //Path check and instantiation
    var path;
    splitPath = splitPath.endsWith("/") ? splitPath : splitPath + "/"
    path = outputPath? (outputPath.endsWith("/") ? outputPath : outputPath + "/") : splitPath;
    var outputFilePath = path + "merged_schema.graphql";
    if (fs.existsSync(outputFilePath) && overWrite) fs.unlinkSync(path + "merged_schema.graphql");
    var returnAST=null;
    //Traverse all possible types and write non-extendible definitions
    types.forEach(currentType => {
        var typePath = splitPath + currentType + "/";
        if (fs.existsSync( typePath)){
            var files = fs.readdirSync(typePath);
            //Iterate through folder files
            var typeAST = null;
            files.forEach(function (file) {
                if (file.endsWith(".graphql")) {
                    try {
                        var name = file.split("_")[1].split(".")[0];
                        var contentFile = fs.readFileSync(typePath + file).toString();
                        var astFile=null;
                        try {
                            astFile = graphqllang.parse(contentFile); 
                        } catch (error) {
                            var regExp = new RegExp(name + "\s*?{(.*?)}", "is");
                            var matches = contentFile.match(regExp);
                            if (matches.length>1 && matches[1].replace(/(\r\n\t|\n|\s|\r\t)/gm,"")===""){
                                regExp = new RegExp("(" + name + "\s*?{).*?(})", "is");
                                contentFile=contentFile.replace(regExp, '$1xtgVirtual:Boolean$2');
                            }
                            try{
                                astFile = graphqllang.parse(contentFile);
                            }catch(error){
                                console.log("Fail parsing file: " + file + " Error: " + error.message);
                            }

                        }
                        if (astFile!==null){
                            astFile.definitions.forEach(definition => {
                                convertLegacyDescriptions(definition);
                            });
                            typeAST=typeAST!==null?graphql.concatAST([typeAST, astFile]): astFile;
                        }
                    } catch (error) {
                        console.log("The file '" + file + "' doesnt have a correct name (type_Name.graphql)");    
                    }
                }
            });
            if (typeAST){
                returnAST= returnAST!==null?graphql.concatAST([returnAST,typeAST]): typeAST;
            }
        }

    });
    return returnAST;
}

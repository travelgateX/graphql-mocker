module.exports = {
    main: main,
    mergeAST: mergeAST
};

const convertLegacyDescriptions = require('../schema_splitter/splitter').convertLegacyDescriptions;
const fs = require('fs');
const graphql= require('graphql');
const graphqllang= require('graphql/language');
const path = require('path');
const { printMergeHelp } = require('./help')

const types = ["commons", "interfaces", "objects", "inputs", "scalars", "enums"];

/**
 * This function iterate all dirs and call to merge the folders
 * 
 * @param {dirs to merge the graphql} dirs 
 */
function mergeAST(dirs){
    var completeAST=null;
    dirs.forEach(function (dir) {
        //Get directory name for comparison
        
        console.log("Proceeding to merge schema at " + dir)
        var partialAST = main(dir);
        if (partialAST){
            completeAST = completeAST!==null?graphql.concatAST([completeAST, partialAST]):partialAST;
        }
        
    });
    return completeAST;
}

/**
 * This function check if type of graphql is empty and added a virtual field in that case
 * 
 * @param {Graphql to check empty} _stringGraphql 
 * @param {Name of type to check} _name 
 */
function checkAndAddVirtualField(_stringGraphql, _name){
    var astFile = null;
    var regExp = new RegExp(_name + "\s*?{(.*?)}", "is");
    var matches = _stringGraphql.match(regExp);
    if (matches && matches.length>1 && matches[1].replace(/(\r\n\t|\n|\s|\r\t)/gm,"")===""){
        regExp = new RegExp("(" + _name + "\s*?{).*?(})", "is");
        _stringGraphql=_stringGraphql.replace(regExp, '$1xtgVirtual:Boolean$2');
    }
    try{
        astFile = graphqllang.parse(_stringGraphql);
    }catch(error){
        console.log("Fail parsing file: " + _name + " Error: " + error.message);
    }
    return astFile;
}

/**
 * This function iterate of _files, parse to AST, convert legacy description to new sytnax and concat all AST
 * 
 * @param {List of files} _files 
 * @param {Type path of file} _pathFile 
 */
function iterateFiles(_files, _pathFile){
    var typeAST = null
    _files.forEach(function (file) {
        if (file.endsWith(".graphql")) {
            try {
                var name = file.split("_")[1].split(".")[0];
                var contentFile = fs.readFileSync(_pathFile + file).toString();
                var astFile=null;
                try {
                    astFile = graphqllang.parse(contentFile); 
                } catch (error) {
                    astFile = checkAndAddVirtualField(contentFile, name);
                    
                }
                if (astFile!==null){
                    astFile.definitions.forEach(definition => {
                        convertLegacyDescriptions(definition);
                    });
                    typeAST=typeAST!==null?graphql.concatAST([typeAST, astFile]): astFile;
                }
            } catch (error) {
                console.log("The file '" + file + "' doesnt have a correct name (type_Name.graphql)");  
                console.log(error);
            }
        }
    });
    return typeAST;
}

/**
 * Princpial function, this find all .graphql into the types folders and merge all in one file called merged_schema.graphql
 * 
 * @param {path to find all grpahql files} _splitPath 
 */
function main(_splitPath) {
    //If --h/--help, show help and exit
    if (_splitPath === "--h" || _splitPath === "--help") {
        printMergeHelp();
        return;
    }
    //If no arguments, print message and return
    if (!_splitPath) {
        console.error('Please, introduce the path containing the splitted schemas to merge as first argument.');
        return;
    }

    //Path check and instantiation
    _splitPath = _splitPath.endsWith(path.sep) ? _splitPath : _splitPath + path.sep
    
    var returnAST=null;
    //Traverse all possible types and write non-extendible definitions
    types.forEach(currentType => {
        var typePath = _splitPath + currentType + path.sep;
        if (fs.existsSync( typePath)){
            var files = fs.readdirSync(typePath);
            //Iterate through folder files
            var typeAST = iterateFiles(files, typePath);
            
            if (typeAST){
                returnAST= returnAST!==null?graphql.concatAST([returnAST,typeAST]): typeAST;
            }
        }

    });
    return returnAST;
}

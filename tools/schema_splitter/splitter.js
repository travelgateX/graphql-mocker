module.exports = {
    main: main,
    convertLegacyDescriptions: convertLegacyDescriptions
};

const fs = require('fs');
const { printSplitHelp } = require('./help');
const graphql= require('graphql');
const graphqllang= require('graphql/language');

//Extendible types
var sourceFile = require('../../sourceFile');

var common = {}, objects = {}, interfaces = {}, scalars = {}, inputs = {}, nonNulls = {}, enums = {}, lists = {}, unions = {};
var buildASTSchema = require('graphql/utilities/buildASTSchema');


var getDescription = buildASTSchema.getDescription;

function getConcreteObjectList(type){
    switch(type){
        case sourceFile.astTypes.EXTEND:
        case sourceFile.astTypes.EXTEND_DEFINITION:
            return common;
            break;
        case sourceFile.astTypes.ENUM:
            return enums;
            break;
        case sourceFile.astTypes.INPUT:
            return inputs;
            break;
        case sourceFile.astTypes.OBJECT:
            return objects;
            break;
        case sourceFile.astTypes.SCALAR:
            return scalars;
            break;
        case sourceFile.astTypes.INTERFACE:
            return interfaces;
            break;
        default:
            console.log("Error we can process this definition: " + type);
            break;
    }
}


function parseDescNode(node){
    if (!node.description){
        var desc =  getDescription(node, {commentDescriptions:true});
        if (desc){
            node.description = {"block":true, "kind":"StringValue", "value":desc};
        }
        
    }
}
function convertLegacyDescriptions(definition){
    var type = definition.kind;
    parseDescNode(definition);
    switch(type){
        case sourceFile.astTypes.ENUM:
            definition.values.forEach(enumValue => {
                parseDescNode(enumValue);
            });
            break;
        case sourceFile.astTypes.UNION:
        case sourceFile.astTypes.SCALAR:
            //The scalar type doesnt have children
            break;
        default:
            if (definition.fields){
                definition.fields.forEach(field => {
                    parseDescNode(field);
                });
            }else{
                var h=0;
            }
            break;
    }
}
function main(schemaPath, outputPath) {
    //If --h/--help, show help and exit
    if (schemaPath === "--h" || schemaPath === "--help") {
        printSplitHelp();
        return;
    }

    //If no arguments, print message and return
    if (!schemaPath) {
        console.log('ERROR: Please, introduce schema path as first argument.');
        return;
    }
    //If schema file does not exist return error
    if (!fs.existsSync(schemaPath)) {
        console.log('ERROR: Schema file does not exist.');
        return;
    }
    //If result path does not exist us project path
    var resultPath;
    if (outputPath && fs.existsSync(outputPath)) {
        resultPath = outputPath;
    } else {
        if (outputPath) console.log("Invalid result path. Splitted files will be created on " + __dirname);
        resultPath = __dirname;
    }
   
    var ASTFile= graphqllang.parse(fs.readFileSync(schemaPath,'utf8'));
    ASTFile.definitions.forEach(definition => {
        var typeDefinition=  definition.kind;
        var correctList = getConcreteObjectList(typeDefinition);
        convertLegacyDescriptions(definition);
        var name = "";
        if (definition.kind === sourceFile.astTypes.EXTEND_DEFINITION){
            name = definition.definition.name.value;
        }else{
            name=definition.name.value;
        }
        correctList[name] = definition;
    });

   
    //Write every file
    if (fs.existsSync(resultPath + "/commons")) deleteFolderRecursive(resultPath + "/commons")
    fs.mkdirSync(resultPath + "/commons");
    writeItems(resultPath, "common", common);

    if (objects != {}) {
        if (fs.existsSync(resultPath + "/objects")) deleteFolderRecursive(resultPath + "/objects")
        fs.mkdirSync(resultPath + "/objects");
        writeItems(resultPath, "object", objects);
    }
    if (interfaces != {}) {
        if (fs.existsSync(resultPath + "/interfaces")) deleteFolderRecursive(resultPath + "/interfaces")
        fs.mkdirSync(resultPath + "/interfaces");
        writeItems(resultPath, "interface", interfaces);
    }
    if (scalars != {}) {
        if (fs.existsSync(resultPath + "/scalars")) deleteFolderRecursive(resultPath + "/scalars")
        fs.mkdirSync(resultPath + "/scalars");
        writeItems(resultPath, "scalar", scalars);
    }
    if (inputs != {}) {
        if (fs.existsSync(resultPath + "/inputs")) deleteFolderRecursive(resultPath + "/inputs")
        fs.mkdirSync(resultPath + "/inputs");
        writeItems(resultPath, "input", inputs);
    }
    if (enums != {}) {
        if (fs.existsSync(resultPath + "/enums")) deleteFolderRecursive(resultPath + "/enums")
        fs.mkdirSync(resultPath + "/enums");
        writeItems(resultPath, "enum", enums);
    }


    console.log("Splitted sorted schema files created on " + resultPath + ".");
    return 1
}


//AUX FUNCTION: Writes a set of similar items into a file.
function writeItems(path, itemType, items) {
    var basePath = path + "/" + itemType + "s/" + itemType + "_";

    //iterate through items
    
    Object.keys(items).forEach(function (x) {
        var resultFile = basePath + x + ".graphql";
        var ASTObject = items[x];
        //Remove file if already exists
        if (fs.existsSync(resultFile)) fs.unlinkSync(resultFile);
        console.log("Writing file: " + resultFile);
        var astString = graphqllang.print(ASTObject);
        fs.writeFileSync(resultFile, astString, 'utf8');
        

    });
}
//AUX FUNCTION: Deletes a file
function deleteFolderRecursive (path) {
    fs.readdirSync(path).forEach(function(file, index){
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else {
        // Delete file
        fs.unlinkSync(curPath);
      }
    });

    //Remove directory
    fs.rmdirSync(path);
}

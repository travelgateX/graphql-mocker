module.exports = {
    main: main,
    convertLegacyDescriptions: convertLegacyDescriptions
};

var buildASTSchema = require('graphql/utilities/buildASTSchema');
const fs = require('fs');
const graphqllang= require('graphql/language');
const path = require('path');
var sourceFile = require('../../sourceFile');
const { printSplitHelp } = require('./help');

//Extendible types
var commons = {}, objects = {}, interfaces = {}, scalars = {}, inputs = {}, enums = {};
var getDescription = buildASTSchema.getDescription;

/**
 * Return the correct map to store AST by type
 * 
 * @param {string type} type 
 */
function getConcreteObjectList(type){
    switch(type){
        case sourceFile.astTypes.EXTEND:
        case sourceFile.astTypes.EXTEND_DEFINITION:
            return commons;
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

/**
 * Get legacy sytnax of description and set as new syntax description
 * 
 * @param {AST node} node 
 */
function parseDescNode(node){
    if (!node.description){
        var desc =  getDescription(node, {commentDescriptions:true});
        if (desc){
            node.description = {"block":true, "kind":"StringValue", "value":desc};
        }
        
    }
}

/**
 * Convert legacy description to new syntax
 * 
 * @param {Node definition} definition 
 */
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

/**
 * Create necesary folders and call writeItems to save the AST Ojbects to files
 * 
 * @param {path of api} _path 
 * @param {type to save (common, object, ...)} _type 
 * @param {Map of AST objects to save} _astFiles 
 */
function writeFilesIntoPath(_path, _type, _astFiles){
    if (fs.existsSync(_path  + _type)) deleteFolderRecursive(_path +_type)
    fs.mkdirSync(_path +_type);
    writeItems(_path, _type, _astFiles);
}

/**
 * Parse schema to AST object and iterate his defintion to split into the types depending of definition.kind
 * 
 * @param {Path of schema} schemaPath 
 * @param {Target folder where save the splitted files} outputPath 
 */
function main(schemaPath, outputPath) {
    //If --h/--help, show help and exit
    if (schemaPath === "--h" || schemaPath === "--help") {
        printSplitHelp();
        return;
    }

    //If no arguments, print message and return
    if (!schemaPath) {
        console.log('ERROR: Please, introduce schema path as first argument.');
        printSplitHelp();
        return;
    }
    //If schema file does not exist return error
    if (!fs.existsSync(schemaPath)) {
        console.log('ERROR: Schema file does not exist.');
        printSplitHelp();
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
        if (typeDefinition != sourceFile.astTypes.SCHEMA_DEFINITION){
            var correctList = getConcreteObjectList(typeDefinition);
            convertLegacyDescriptions(definition);
            var name = "";
            if (definition.kind === sourceFile.astTypes.EXTEND_DEFINITION){
                name = definition.definition.name.value;
            }else{
                name=definition.name.value;
            }
            correctList[name] = definition;
        }
    });

   
    //Write every file
    if (commons != {}) writeFilesIntoPath(resultPath, "commons", commons);
    
    if (objects != {}) writeFilesIntoPath(resultPath, "objects", objects);
    
    if (interfaces != {}) writeFilesIntoPath(resultPath, "interfaces", interfaces);
    
    if (scalars != {}) writeFilesIntoPath(resultPath, "scalars", scalars);
    
    if (inputs != {}) writeFilesIntoPath(resultPath, "inputs", inputs);
    
    if (enums != {}) writeFilesIntoPath(resultPath, "enums", enums);
    
    console.log("Splitted sorted schema files created on " + resultPath + ".");
    return 1
}


/**
 * Save each AST object into the path pass thru args with the correct name
 * 
 * @param {folder to save the files} _path 
 * @param {type of files} _itemType 
 * @param {map of AST objects to save} _items 
 */
function writeItems(_path, _itemType, _items) {
    var basePath = _path  + _itemType + path.sep + _itemType.slice(0,-1) + "_";

    //iterate through items
    
    Object.keys(_items).forEach(function (x) {
        var resultFile = basePath + x + ".graphql";
        var ASTObject = _items[x];
        //Remove file if already exists
        if (fs.existsSync(resultFile)) fs.unlinkSync(resultFile);
        console.log("Writing file: " + resultFile);
        var astString = graphqllang.print(ASTObject);
        fs.writeFileSync(resultFile, astString, 'utf8');
        

    });
}

/**
 * Delete folders recursive
 * 
 * @param {path to delete folders} _path 
 */
function deleteFolderRecursive (_path) {
    fs.readdirSync(_path).forEach(function(file, index){
      var curPath = _path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else {
        // Delete file
        fs.unlinkSync(curPath);
      }
    });
    //Remove directory
    fs.rmdirSync(_path);
}

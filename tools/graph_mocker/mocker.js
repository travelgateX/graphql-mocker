module.exports = {
    main: main
}
const Faker = require('../graph_faker/gr_faker.js');
const fs = require('fs');
const graphql= require('graphql');
const graphqllang= require('graphql/language');
const mergeAST = require('../schema_merger/merger').mergeAST;
const { join } = require('path');
const { printMockerHelp } = require('./help');
const sourceFile =  require('../../sourceFile')

var fakers=[];

/**
 * The function prepare path adding the last dash and removing if exists the merged_schema.graphql into the path
 * 
 * @param {Path to prepare} path 
 */
function preparePaths(path){
    //Prepare/Check path
    path = (path.endsWith("/")) ? path : path + "/"; //Add "/" if necessary to avoid furture appends
    if (!fs.existsSync(path)) { console.log("ERROR: Could not find path " + path); return; }
    if (fs.existsSync(path + "merged_schema.graphql")) fs.unlinkSync(path + "merged_schema.graphql");

}

/**
 * This functions return a list with all directories from a concrete path
 * 
 * @param {Path where we start collect all dirs} path 
 */
function getDirectories(path){
    var isDirectory = path => fs.lstatSync(path).isDirectory();
    return fs.readdirSync(path).map(name => join(path, name)).filter(isDirectory).filter(
        function(file) {
            if(file.indexOf(".git")<0) return file;
        }
    );
}

/**
 * This function save the AST Object into a merged_schema.graphql file
 * 
 * @param {Path to save the AST} path 
 * @param {AST Object to save} astObject 
 */
function saveASTtoFile(path, astObject){
    if (fs.existsSync(path +  "merged_schema.graphql")) fs.unlinkSync(path + "merged_schema.graphql");
    fs.writeFileSync(path +  "merged_schema.graphql", graphqllang.print(astObject), 'utf8');

}

function getExtensions(completeAST){
    var extensions = [];
    completeAST.definitions.forEach(definition => {
        if (definition.kind === sourceFile.astTypes.EXTEND || definition.kind === sourceFile.astTypes.EXTEND_DEFINITION) {
            extensions.push(definition);
        }
    });
    return extensions;
}

/**
 * Check dependcies between completeAST and apiAST, all references into
 * completeAST to any type of apiAST will be replace to new type mockerTGX.
 * This type will be include into the completeAST
 * 
 * @param {Complete AST Object} completeAST 
 * @param {Api AST Object} apiAST 
 */
function cleanCircularDependencies(completeAST, apiAST){
    completeAST.definitions.forEach(definition => {
        if (definition.fields) {
            definition.fields.forEach(field =>{
                var targetType=field;

                while (targetType.type.kind !== "NamedType"){
                    targetType = targetType.type;
                }
                var nameType = targetType.type.name.value;
                
                if (apiAST.definitions.filter(function(element){
                    return checkObjectType(element, nameType);
                }).length>0){
                    targetType.type.name.value = "mockerTGX";
                }
            });
        }
        
    });
    // Create mockerTGX type for circular dependencies
    var mockerTGX = `
    type mockerTGX{
        id:ID!
    }`;
    // Added mockerTGX type to complete schema 
    var mockerTGXAST = graphqllang.parse(mockerTGX);
    completeAST = graphql.concatAST([completeAST, mockerTGXAST]);
    return completeAST;
}

/**
 * Find the object type with that name into AST Object
 * 
 * @param {AST Object} astObject 
 * @param {Name} name 
 */
function getNodeTypeByName(astObject, name){
    var node = null
    for (definition of astObject.definitions) {
        if (definition.kind === sourceFile.astTypes.OBJECT){
            if (definition.name.value === name){
                node = definition;
                break;
            }
        }
    }
    return node;
}


function deleteTypeByName(astObject, name){
    var node = null
    for (definition of astObject.definitions) {
        if (definition.kind === sourceFile.astTypes.OBJECT){
            if (definition.name.value === name){
                node = definition;
                break;
            }
        }
    }
    astObject.definitions.splice(astObject.definitions.indexOf(node),1);
    return astObject;
}
function deleteVirtualField(astObject){
    var virtualField=null;
    astObject.fields.forEach(field => {
        if (field.name.value === "xtgVirtual"){
            virtualField = field;
        }        
    });
    if (virtualField){
        astObject.fields.splice(astObject.fields.indexOf(virtualField),1);
    }
}

function hasField(astObject, fieldName){
    for (field of astObject.fields) {
        if (field.name.value === fieldName){
            return true;
        }
    }
    return false;
}
/**
 * Check source type of extensions and added all fields to the original type.
 * Remove exentsion definitions from schema
 * 
 * @param {AST Object with the schema} astObject 
 * @param {List of extensions} extensions 
 */
function expandExtensions(astObject, extensions){
    extensions.forEach(extendType => {
        var name = extendType.name.value;
        var originalType = getNodeTypeByName(astObject,name);
        astObject = deleteTypeByName(astObject, name);
        if (originalType){
            extendType.fields.forEach(field => {
                if (!hasField(originalType, field.name.value)){
                    originalType.fields.push(field);
                }
            });
            deleteVirtualField(originalType);
        }
        astObject.definitions.push(originalType);
        astObject.definitions.splice(astObject.definitions.indexOf(extendType),1)
    });
    return astObject;
}

/**
 * The main function
 * This function is in charge of:
 * - merge the complete schema, without the API part
 * - merge api schema
 * - convert legacy description syntax to new syntax inline
 * - call graphql-faker with complete schema and api schema as extension from complete
 * 
 * @param {Path with our schema strucutre} path 
 * @param {Name of api (admin, mappea, ...)} apiName 
 * @param {Name of working api (iam, core, ..)} workingAPI 
 */
function main(path, apiName, workingAPI) {
    if (!path) { console.log("ERROR: No path was provided."); return; }
    //If --h/--help, show help and exit
    if (path === "--h" || path === "--help") {
        printMockerHelp();
        return;
    }
    //Prepare path for complete schema
    preparePaths(path);
    
    //Get all dirs where find .graphql files except the api/wApi folder
    var dirst = getDirectories(path);
    var dirs= [];
    dirst.forEach (function (dirt){
        if (!dirt.includes(apiName)){
            dirs = dirs.concat(getDirectories(dirt));
        }else{
            dirs = dirs.concat(getDirectories(dirt).filter(item => {
                return !item.includes(workingAPI);
            }));
        }
        
    });
    
    //Merge complete schema and create AST Object
    var completeAST = mergeAST(dirs, path, true);

    //Get all extensions objects type
    var extensions = getExtensions(completeAST);
    
    //Expands all extend types
    completeAST=expandExtensions(completeAST, extensions);

    //Save complete schema
    saveASTtoFile(path, completeAST);
    console.log("Schemas merged.");
    
    //Create faker instance for complete schema
    var principalSchemeCommand = path + "merged_schema.graphql";
    var principalFaker = new Faker.Faker(principalSchemeCommand, callback);
    fakers.push(principalFaker);
    //If call with apiName we need merge the api and clean the circular dependencies
    if (apiName) {
        var apiFaker=null;
        
        //Calculate and prepare path for working with the API
        var apiPath = path + apiName + "/";
        if (!fs.existsSync(apiPath)) { fs.mkdirSync(apiPath);} 
        preparePaths(apiPath + workingAPI);
        var wApiPath = apiPath + workingAPI + "/";
        //Merge API and convert into AST Object
        var apiAST = mergeAST([wApiPath], wApiPath, true);
        console.log("API schemas merged.");
        
        //Save api AST Object to file
        saveASTtoFile(wApiPath, apiAST);

        //Create Faker for API
        apiFaker =  new Faker.Faker(wApiPath + "merged_schema.graphql", callback, "9003", "http://localhost:9002/graphql");
        fakers.push(apiFaker);           
        
        //Clean ciruclar dependencies and save the complete AST object
        completeAST=cleanCircularDependencies(completeAST, apiAST);
        saveASTtoFile(path, completeAST);
    }

    console.log("General schema raised on faker. --> Editor URL: http://localhost:9002/editor")
    console.log("\n\nREMEMBER: To save your work, make sure to save it on Faker and run 'save' Mocker's command before commit.");
    fakers[0].runFaker();
    if (apiName){
        console.log("Extended API raised on faker. --> Editor URL: http://localhost:9003/editor");
        setTimeout(function() {
            runApiFaker(fakers);
        }, 1000);
        
        
    }
    return fakers;
}

/**
 * Run second faker if the principal is running, otherwise should be wait until princpial is working
 * 
 * @param {List of fakers} fakers 
 */
function runApiFaker(fakers){
    if (!fakers[0].isRunning()){
        setTimeout(function() {
            runApiFaker(fakers);
        }, 1000);
    }else{
        fakers[1].runFaker();
    }
}

/**
 * Callback function to show the output process of fakers
 * 
 * @param {String with the output from process} text 
 */
function callback(text) {
    console.log(text);
}

/**
 * Checck if the ast node has the name equal to targetType
 * 
 * @param {AST Node} element 
 * @param {Type to check} targetType 
 */
function checkObjectType(element, targetType) {
    if (element.name){
        return element.name.value===targetType;
    }
}

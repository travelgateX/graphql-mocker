module.exports = {
    main: main,
    preparePaths: preparePaths,
    getNodeTypeByName:getNodeTypeByName,
    getDirectories:getDirectories
}
const Faker = require('../graph_faker/gr_faker.js');
const fs = require('fs');
const graphql= require('graphql');
const graphqllang= require('graphql/language');
const mergeAST = require('../schema_merger/merger').mergeAST;
const path = require('path');
const { printMockerHelp } = require('./help');
const sourceFile =  require('../../sourceFile')
const extractApiAndDepends = require('../graph_mocker/extract_api_schema').main;


var fakers=[];

/**
 * The function prepare path adding the last dash and removing if exists the merged_schema.graphql into the path
 * 
 * @param {Path to prepare} _path 
 */
function preparePaths(_path){
    //Prepare/Check path
    _path = (_path.endsWith(path.sep)) ? _path : _path + path.sep; //Add "/" if necessary to avoid furture appends
    if (!fs.existsSync(_path)) { console.log("ERROR: Could not find path " + _path); return; }
    if (fs.existsSync(_path + "merged_schema.graphql")) fs.unlinkSync(_path + "merged_schema.graphql");

}

/**
 * This functions return a list with all directories from a concrete path
 * 
 * @param {Path where we start collect all dirs} _path 
 */
function getDirectories(_path){
    var isDirectory = _path => fs.lstatSync(_path).isDirectory();
    return fs.readdirSync(_path).map(name => path.join(_path, name)).filter(isDirectory).filter(
        function(file) {
            if(file.indexOf(".git")<0) return file;
        }
    );
}

/**
 * This function save the AST Object into a merged_schema.graphql file
 * 
 * @param {Path to save the AST} _path 
 * @param {AST Object to save} _astObject 
 */
function saveASTtoFile(_path, _astObject){
    if (fs.existsSync(_path +  "merged_schema.graphql")) fs.unlinkSync(_path + "merged_schema.graphql");
    fs.writeFileSync(_path +  "merged_schema.graphql", graphqllang.print(_astObject), 'utf8');

}

function getExtensions(_completeAST){
    var extensions = [];
    _completeAST.definitions.forEach(definition => {
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
 * @param {Complete AST Object} _completeAST 
 * @param {Api AST Object} _apiAST 
 */
function cleanCircularDependencies(_completeAST, _apiAST){
    _completeAST.definitions.forEach(definition => {
        if (definition.fields) {
            definition.fields.forEach(field =>{
                var targetType=field;

                while (targetType.type.kind !== sourceFile.astTypes.NAME_TYPE){
                    targetType = targetType.type;
                }
                var nameType = targetType.type.name.value;
                
                if (_apiAST.definitions.filter(function(element){
                    return checkObjectType(element, nameType);
                }).length>0){
                    targetType.type.name.value = "mockerTGX";
                }
                if (field.arguments){
                    field.arguments.forEach(arg => {
                        var a_type = arg.type;
                        while (!a_type.name){
                            a_type = a_type.type;
                        }
                        var nameType = a_type.name.value;
                        if (_apiAST.definitions.filter(function(element){
                            return checkObjectType(element, nameType);
                        }).length>0){
                            a_type.type.name.value = "mockerTGX";
                        }
                    });
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
    _completeAST = graphql.concatAST([_completeAST, mockerTGXAST]);
    return _completeAST;
}

/**
 * Find the object type with that name into AST Object
 * 
 * @param {AST Object} _astObject 
 * @param {Name} _name 
 */
function getNodeTypeByName(_astObject, _name, _onlyObj=false){
    var node = null
    for (definition of _astObject.definitions) {
        var search=true;
        if (_onlyObj){
            if (definition.kind !== sourceFile.astTypes.OBJECT){
                search=false;
            }
        }
        if (search && definition.name.value === _name){
            node = definition;
            break;
        }
    }
    return node;
}

/**
 * Find definition type with name into AST object and delete it
 * 
 * @param {AST object} _astObject 
 * @param {Name of type} _name 
 */
function deleteTypeByName(_astObject, _name){
    var node = null
    for (definition of _astObject.definitions) {
        if (definition.kind === sourceFile.astTypes.OBJECT){
            if (definition.name.value === _name){
                node = definition;
                break;
            }
        }
    }
    _astObject.definitions.splice(_astObject.definitions.indexOf(node),1);
    return _astObject;
}

/**
 * Check if the AST object has a virtual field and delete it
 * 
 * @param {AST Object to delete virtual field} _astObject 
 */
function deleteVirtualField(_astObject){
    var virtualField=null;
    _astObject.fields.forEach(field => {
        if (field.name.value === "xtgVirtual"){
            virtualField = field;
        }        
    });
    if (virtualField){
        _astObject.fields.splice(_astObject.fields.indexOf(virtualField),1);
    }
}
/**
 * Check if the AST object has a field with name fieldName
 * 
 * @param {AST Object to check} _astObject 
 * @param {Filed name} _fieldName 
 */
function hasField(_astObject, _fieldName){
    for (field of _astObject.fields) {
        if (field.name.value === _fieldName){
            return true;
        }
    }
    return false;
}
/**
 * Check source type of extensions and added all fields to the original type.
 * Remove exentsion definitions from schema
 * 
 * @param {AST Object with the schema} _astObject 
 * @param {List of extensions} _extensions 
 */
function expandExtensions(_astObject, _extensions){
    _extensions.forEach(extendType => {
        var name = extendType.name.value;
        var originalType = getNodeTypeByName(_astObject, name, true);
        _astObject = deleteTypeByName(_astObject, name);
        if (originalType){
            extendType.fields.forEach(field => {
                if (!hasField(originalType, field.name.value)){
                    originalType.fields.push(field);
                }
            });
            deleteVirtualField(originalType);
        }
        _astObject.definitions.push(originalType);
        _astObject.definitions.splice(_astObject.definitions.indexOf(extendType),1)
    });
    return _astObject;
}

/**
 * The main function
 * This function is in charge of:
 * - merge the complete schema, without the API part
 * - merge api schema
 * - convert legacy description syntax to new syntax inline
 * - call graphql-faker with complete schema and api schema as extension from complete
 * 
 * @param {Path with our schema strucutre} _path 
 * @param {Path of api (admin/iam, mappea/mappea, ...)} _apiPath  
 */
function main(_path, _apiPath) {
    if (!_path) { 
        console.log("ERROR: No path was provided.");
        printMockerHelp(); 
        return; 
    }
    
    //If --h/--help, show help and exit
    if (_path === "--h" || _path === "--help") {
        printMockerHelp();
        return;
    }
    
    extractApiAndDepends(_path, _apiPath);
    var wApiPath = _path + _apiPath + path.sep;
    var principalSchemeCommand = wApiPath +  "api_and_depends_schema.graphql";
    var principalFaker = new Faker.Faker(principalSchemeCommand);
    principalFaker.runFaker();
    return [principalFaker];
    //Prepare _path for complete schema
    /*preparePaths(_path);
    
    //Get all dirs where find .graphql files except the api/wApi folder
    var dirst = getDirectories(_path);
    var dirs= [];
    dirst.forEach (function (dirt){
        dirs = dirs.concat(getDirectories(dirt));
    });
    dirs = dirs.filter(dir => {
        return !dir.includes(_apiPath);
    });

    
    //Merge complete schema and create AST Object
    var completeAST = mergeAST(dirs);

    //Get all extensions objects type
    var extensions = getExtensions(completeAST);
    
    //Expands all extend types
    completeAST=expandExtensions(completeAST, extensions);

    //Save complete schema
    saveASTtoFile(_path, completeAST);
    console.log("Schemas merged. into: " + _path);
    
    //If call with apiName we need merge the api and clean the circular dependencies
    if (_apiPath) {
        //Create faker instance for complete schema
        var principalSchemeCommand = _path + "merged_schema.graphql";
        var principalFaker = new Faker.Faker(principalSchemeCommand);
        fakers.push(principalFaker);
        var apiFaker=null;
        
        //Calculate and prepare path for working with the API
        var wApiPath = _path + _apiPath + path.sep;
        if (!fs.existsSync(wApiPath)) {
            wApiPath.split(path.sep).reduce((currentPath, folder) => {
                currentPath += folder + path.sep;
                if (!fs.existsSync(currentPath)){
                    fs.mkdirSync(currentPath);
                }
                return currentPath;
            }, ''); 
        } 
        preparePaths(wApiPath);
        //Merge API and convert into AST Object
        var apiAST = mergeAST([wApiPath]);
        console.log("API schemas merged.");
        
        if (apiAST){
            //Save api AST Object to file
            saveASTtoFile(wApiPath, apiAST);
        }

        //Create Faker for API
        //apiFaker =  new Faker.Faker(wApiPath + "merged_schema.graphql", "9003", "http://localhost:9002/graphql");
        apiFaker =  new Faker.Faker(wApiPath + "merged_schema.graphql");
        fakers.push(apiFaker);           
        
        //Clean ciruclar dependencies and save the complete AST object
        if (apiAST){
            completeAST=cleanCircularDependencies(completeAST, apiAST);
            saveASTtoFile(_path, completeAST);
        }
    }

    if (_apiPath){
        console.log("General schema raised on faker. --> Editor URL: http://localhost:9002/editor")
        console.log("\n\nREMEMBER: To save your work, make sure to save it on Faker and run 'save' Mocker's command before commit.");
        fakers[0].runFaker();
        console.log("Extended API raised on faker. --> Editor URL: http://localhost:9003/editor");
        setTimeout(function() {
            runApiFaker(fakers);
        }, 1000);
        
        
        
    }
    return fakers;
    */
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

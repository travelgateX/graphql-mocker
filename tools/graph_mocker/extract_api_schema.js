
const { preparePaths , getNodeTypeByName, getDirectories} = require('./mocker')
const mergeAST = require('../schema_merger/merger').mergeAST;
const graphqllang= require('graphql/language');
const graphql= require('graphql');
const sourceFile =  require('../../sourceFile');
const path = require ('path');
const fs = require('fs');


if (!process.argv[2] && !process.argv[3]) { 
    console.log("ERROR: No path or api was provided.");
    return; 
}

extractApiAndDepends(process.argv[2], process.argv[3]);

/**
 * Return a list with all definitions names
 * 
 * @param {AST Object} _astObject 
 */
function getAllDefintionsName(_astObject){
    var definitionsName = [];
    _astObject.definitions.forEach(definition => {
        if (definition.name && definition.kind !== (sourceFile.astTypes.EXTEND|| sourceFile.astTypes.EXTEND_DEFINITION)
          && !definitionsName.includes(definition.name.value)){
            definitionsName.push(definition.name.value);
        }
    });
    return definitionsName;
}

/**
 * Check if the type name is one of basic types on GraphQL
 * 
 * @param {Type name} _name 
 */
function isBasicType(_name){
    var returnVal=false;
    Object.keys(sourceFile.astBasicTypes).forEach(basicType => {
        if (sourceFile.astBasicTypes[basicType]===_name){
            returnVal = true;
            return;
        }
    });
    return returnVal;
}

/**
 * Check if the type name there arent into the depends definitions or in the graphql itself.
 * Then added to depends names list
 * 
 * @param {Type name} _nameType 
 * @param {List of actual definitons on GraphQL} _listDefinitionsName 
 * @param {List of actual names for the depends} _dependsDefinitionsName 
 */
function addType(_nameType, _listDefinitionsName, _dependsDefinitionsName){
    if (!isBasicType(_nameType)){
        if (!_listDefinitionsName.includes(_nameType) && !_dependsDefinitionsName.includes(_nameType)){
            _dependsDefinitionsName.push(_nameType);
        }
    }
    return _dependsDefinitionsName;
}

/**
 * Find the definition object into the complete AST with each depends name
 * Return a list with all depends definitions objects
 * 
 * @param {AST Object} _completeAST 
 * @param {List with all depends types names} _listDepends 
 */
function getDependsDefinitions(_completeAST, _listDepends){
    var listDependsDefintions = [];
    _listDepends.forEach(dependName => {
        listDependsDefintions.push(getNodeTypeByName(_completeAST, dependName));
    });
    return listDependsDefintions;
}

/**
 * Get the name of node AST
 * 
 * @param {AST Object Node} _astObject 
 */
function getTargetName(_astObject){
    var targetType=_astObject;
    while (targetType.kind !== sourceFile.astTypes.NAME_TYPE){
        targetType = targetType.type;
    }
    return targetType.name.value;
}

/**
 * Given a list of field AST objects, we need get the types of that fields and check
 * if the types is on own graphql itself or else added this type name as a 
 * depends type name to find in the complete AST later
 * 
 * @param {List with field AST objects} _fields 
 * @param {List with type names on own graphql itself} _listDefinitions 
 * @param {List with type names depends} _dependsDefinitionsName 
 */
function getDependsNamesFields(_fields, _listDefinitions,  _dependsDefinitionsName){
    _fields.forEach(field => {
        var nameType = getTargetName(field.type);
        _dependsDefinitionsName = addType(nameType, _listDefinitions, _dependsDefinitionsName);
        if (field.arguments){
            field.arguments.forEach(arg => {
                var nameType = getTargetName(arg.type);
                _dependsDefinitionsName = addType(nameType, _listDefinitions, _dependsDefinitionsName);
            });
        }
    });
    return _dependsDefinitionsName;
}

/**
 * Given a list of interface AST objects, we need get the types of that interface and check
 * if the types is on own graphql itself or else added this type name as a 
 * depends type name to find in the complete AST later
 * 
 * @param {List with interface AST objects implemented by a object type} _interfaces 
 * @param {List with type names on own graphql itself} _listDefinitions 
 * @param {List with type names depends} _dependsDefinitionsName 
 */
function getDependsNamesImplementsInterfaces(_interfaces, _listDefinitions,_dependsDefinitionsName){
    _interfaces.forEach(interface => {
        var nameType = getTargetName(interface);
        _dependsDefinitionsName = addType(nameType, _listDefinitions, _dependsDefinitionsName); 
    });
    return _dependsDefinitionsName;
}

/**
 * Given a AST node check if it implement any interfaces and get the depends for that interfaces.
 * Also get all depends type for his fields
 * 
 * @param {AST Node for object type} _astObject 
 * @param {List with type names on own graphql itself} _listDefinitions 
 * @param {List with type names depends} _dependsDefinitionsName 
 */
function getDependsNamesCommonObject(_astObject, _listDefinitions, _dependsDefinitionsName){
    if (_astObject.interfaces){
        _dependsDefinitionsName = getDependsNamesImplementsInterfaces(_astObject.interfaces,_listDefinitions, _dependsDefinitionsName);    
    }
    if (_astObject.fields){
        _dependsDefinitionsName = getDependsNamesFields(_astObject.fields, _listDefinitions,_dependsDefinitionsName);   
    }
    return _dependsDefinitionsName;
}

/**
 * Walk whole schema and find the dependent type names that there arent into itself
 * 
 * @param {AST Object with Api schema} _astObject 
 */
function getAllDependsTypes(_astObject){
    var listDefinitionsName = getAllDefintionsName(_astObject);
    var dependsDefinitionsName = [];
    _astObject.definitions.forEach(definition => {
        var type =  definition.kind
        switch(type){
            case sourceFile.astTypes.UNION:
                definition.types.forEach(unionValue => {
                    var nameType = unionValue.name.value;
                    dependsDefinitionsName = addType(nameType, listDefinitionsName, dependsDefinitionsName);
                });
                break;
            case sourceFile.astTypes.ENUM:
            case sourceFile.astTypes.SCALAR:
                //The scalar type doesnt have children
                break;
            case sourceFile.astTypes.EXTEND:
            case sourceFile.astTypes.EXTEND_DEFINITION:
                var nameType = definition.name.value
                dependsDefinitionsName = addType(nameType, listDefinitionsName, dependsDefinitionsName);
                break;
            default:
                dependsDefinitionsName = getDependsNamesCommonObject(definition,listDefinitionsName,dependsDefinitionsName);
                break;
        }
    });
    return dependsDefinitionsName;
}

/**
 * Check if the object is called as the name pass thru the args. Avoid the extend objects
 * 
 * @param {AST Object node} _astObject 
 * @param {Name type} _defName 
 */
function hasDefinition (_astObject, _defName){
    var returnVal = false;
    _astObject.definitions.forEach(def => {
        if (def.kind !== (sourceFile.astTypes.EXTEND || sourceFile.astTypes.EXTEND_DEFINITION)){
            if (def.name.value === _defName){
                returnVal = true;
                return;
            }
        }
    });
    return returnVal;
}

/**
 * Check if the AST object has each definitions, else add them
 * 
 * @param {AST Object with API Schema} _astObject 
 * @param {List with definitions objects} _listDefinitions 
 */
function addDefinitions(_astObject, _listDefinitions){
    _listDefinitions.forEach(definition => {
        if (!hasDefinition(_astObject, definition.name.value)){
            _astObject.definitions.push(definition);
        }
    });
    return _astObject;
}

/**
 * Walk for the definitions and return a list of their names
 * 
 * @param {AST Object with API schema} _astObject 
 */
function getAllQueryDefsNames(_astObject){
    var queryNames = [];
    _astObject.definitions.forEach(def => {
        if (def.kind === sourceFile.astTypes.OBJECT && def.name.value.includes("Query")){
            queryNames.push(def.name.value);
        }
    });
    return queryNames;
}

/**
 * Get a api schema file with all definitions from the API and his dependencies from the complete schema
 * 
 * @param {Path of structure folder of schema} _schemaProject 
 * @param {Api name} _apiName 
 */
function extractApiAndDepends(_schemaProject, _apiName){

    _schemaProject = (_schemaProject.endsWith(path.sep)) ? _schemaProject : _schemaProject + path.sep; //Add "/" if necessary to avoid furture appends
    if (!fs.existsSync(_schemaProject)) { console.log("ERROR: Could not find path " + _schemaProject); return; }
    
    //Get all dirs where find .graphql files except the api/wApi folder
    var dirst = getDirectories(_schemaProject);
    var dirs= [];
    dirst.forEach (function (dirt){
        dirs = dirs.concat(getDirectories(dirt));
    });
    //Merge complete schema and create AST Object
    var completeAST = mergeAST(dirs);

    var wApiPath = _schemaProject + _apiName + path.sep;
    if (!fs.existsSync(wApiPath)) {
        wApiPath.split(path.sep).reduce((currentPath, folder) => {
            currentPath += folder + path.sep;
            if (!fs.existsSync(currentPath)){
                fs.mkdirSync(currentPath);
            }
            return currentPath;
        }, ''); 
    } 

    wApiPath = (wApiPath.endsWith(path.sep)) ? wApiPath : wApiPath + path.sep; //Add "/" if necessary to avoid furture appends
    if (!fs.existsSync(wApiPath)) { console.log("ERROR: Could not find path " + wApiPath); return; }
    
    //Merge API and convert into AST Object
    var apiAST = mergeAST([wApiPath]);

    var listDepends = getAllDependsTypes(apiAST);
    while (listDepends.length>0){
        var listDefinitions = getDependsDefinitions(completeAST, listDepends);
        apiAST = addDefinitions(apiAST, listDefinitions);
        listDepends = getAllDependsTypes(apiAST);
    }

    if (!hasDefinition(apiAST, "Query")){
        var queryNames = getAllQueryDefsNames(apiAST);
        if (queryNames.length>0){
            var queryType = "type Query{";
            queryNames.forEach(queryName => {
                queryType += queryName + ":" + queryName;
            });
            queryType += "}";
            var queryAST = graphqllang.parse(queryType);
            apiAST = graphql.concatAST([queryAST, apiAST]);
        }
    }

    if (fs.existsSync(wApiPath +  "api_and_depends_schema.graphql")) fs.unlinkSync(wApiPath + "api_and_depends_schema.graphql");
    fs.writeFileSync(wApiPath +  "api_and_depends_schema.graphql", graphqllang.print(apiAST), 'utf8');
    console.log("Extend API Schema saved into " + wApiPath + "api_and_depends_schema.graphql");
}
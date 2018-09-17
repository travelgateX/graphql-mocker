module.exports = {
    main: main
}
const graphql= require('graphql');
const gpl = require('graphql-tag');

const splitter = require('../schema_splitter/splitter').main;
const merger = require('../schema_merger/merger').main;
const Faker = require('../graph_faker/gr_faker.js');
const { printMockerHelp } = require('./help');
const { join, basename } = require('path');
const fs = require('fs');
var fakers=[];

var sourceFile = require('../../sourceFile');
//Extendible types
var extendibles = sourceFile.extendibles;
var extendedTypes = {};

//1. Merge schema/s
//2. Fake merged schema
//OPTIONAL: If any API was specified:
//  3. Merge API schema
//  4. Fake API schema extending merged schema
function main(path, apiName, workingAPIs) {
    if (!path) { console.log("ERROR: No path was provided."); return; }
    //If --h/--help, show help and exit
    if (path === "--h" || path === "--help") {
        printMockerHelp();
        return;
    }

    //Prepare/Check path
    path = (path.endsWith("/")) ? path : path + "/"; //Add "/" if necessary to avoid furture appends
    if (!fs.existsSync(path)) { console.log("ERROR: Could not find path " + path); return; }
    if (fs.existsSync(path + "merged_schema.graphql")) fs.unlinkSync(path + "merged_schema.graphql");

    //Prepare workingAPIs
    if (workingAPIs) workingAPIs = workingAPIs.split(",")

    //1. Merge schema/s
    //Iterate through all APIs except the named and merge them
    var apiPath = path + apiName + "/";
    var isDirectory = source => fs.lstatSync(source).isDirectory();
    var getDirectories = source => fs.readdirSync(source).map(name => join(source, name)).filter(isDirectory).filter(function(file) {
        if(file.indexOf(".git")<0) return file;
    })

    //Iterate through directories (merger will collide all .graphql schemas within every directory that are on the split format, if any)
    var dirst = getDirectories(path);
    console.log("Dirst:"+dirst);
    var dirs= [];
    dirst.forEach (function (dirt){
        if (!dirt.includes(apiName)){
            dirs = dirs.concat(getDirectories(dirt));
        }else{
            var apiDirectories = getDirectories(dirt);
            workingAPIs.forEach(wApi => {
                apiDirectories.forEach(apiDirs => {
                    if (!apiDirs.includes(workingAPIs)){
                        dirs = dirs.concat(apiDirs);
                    }   
                });
                 
            });
            
        }

    });

    console.log(apiName);
    dirs.forEach(function (dir) {
        //Get directory name for comparison
        var dirName = basename(dir);
        console.log(dir);
        console.log(dirName);

        console.log("Proceeding to merge schema at " + dir)
        var extensions = merger(dir, path, "false");

        updateExtendibles(extensions);
        //}
    });
    if (!fs.existsSync(apiPath)) { fs.mkdirSync(apiPath);} 

    writeExtendibles(path + "merged_schema.graphql");

    console.log("Schemas merged.");

    var apiFaker=null;
    var principalSchemeCommand = path + "merged_schema.graphql";
    var apiQL=null;
    if (apiName) {
        var wApi =  workingAPIs[0];
        if (fs.existsSync(apiPath + wApi + "/" +  "merged_schema.graphql")) fs.unlinkSync(apiPath + wApi + "/" + "merged_schema.graphql");
        if (workingAPIs.length<=0){
            console.log("ERROR: you must specify a working API");
            return;
        }
        
        
        //3. Merge API schema
        merger(apiPath + wApi + "/", apiPath + wApi + "/", "false", "true");
        apiFaker =  new Faker.Faker(apiPath + wApi + "/" + "merged_schema.graphql", callback, "9003", "http://localhost:9002/graphql");
        fakers.push(apiFaker);    
        var apiQL= gpl(fs.readFileSync(apiPath + wApi + "/" + "merged_schema.graphql",'utf8'));
    
        
        
        var principalQL= gpl(fs.readFileSync(path + "merged_schema.graphql",'utf8'));
        var circularDependcy = [];
        principalQL.definitions.forEach(definition => {
            if (definition.fields) {
                definition.fields.forEach(field =>{
                    var targetType=field;

                    while (targetType.type.kind !== "NamedType"){
                        targetType = targetType.type;
                    }
                    var nameType = targetType.type.name.value;
                    
                    if (apiQL.definitions.filter(function(element){
                        return getObjectsNames(element, nameType);
                    }).length>0){
                        if (!circularDependcy.includes(nameType)){
                            circularDependcy.push(nameType);
                        }
                        targetType.type.name.value = "mockerTGX";
                    }
                });
            }
        });
        var mockerTGX = `
        type mockerTGX{
            id:ID!
        }`;
        var mockerTGXAST = gpl(mockerTGX);
        principalQL = graphql.concatAST([principalQL, mockerTGXAST]);
        console.log( graphql.buildASTSchema(principalQL));
        fs.writeFileSync(path + "merged_schema.graphql", graphql.printSchema(graphql.buildASTSchema(principalQL)), 'utf8');
        var hola=0;
        //4. Fake API schema extending merged schema
        
    }

    //2. Fake merged schema
    console.log(path + "merged_schema.graphql")
    normalizeMerged(path,apiName);
    var principalFaker = new Faker.Faker(principalSchemeCommand, callback);
    fakers.push(principalFaker);

    console.log("General schema raised on faker. --> Editor URL: http://localhost:9002/editor")
    console.log("\n\nREMEMBER: To save your work, make sure to save it on Faker and run 'save' Mocker's command before commit.");
    principalFaker.runFaker();
    if (apiName){
        console.log("Extended API raised on faker. --> Editor URL: http://localhost:9003/editor");
        setTimeout(function() {
            runApiFaker(principalFaker, apiFaker);
        }, 1000);
        
        
    }
    return fakers;
}

function runApiFaker(principalfaker, apifaker){
    if (!principalfaker.isRunning()){
        setTimeout(function() {
            runApiFaker(principalfaker, apifaker);
        }, 1000);
    }else{
        apifaker.runFaker();
    }
}

function updateExtendibles(extensions) {
    Object.keys(extensions).forEach(function (i) {
        if (extendedTypes[i]) {
            //Merge definitions
            var value = extendedTypes[i];
            var j = countLinesUntilDefinition(extensions[i]);
            value.splice(-2, 2);                                                   //Remove "}"
            extendedTypes[i] = value.concat(extensions[i].slice(j, extensions[i].length));    //Add new definition except definition line.
        } else extendedTypes[i] = extensions[i];
    })
}


function countLinesUntilDefinition(value) {
    var count = 0;
    var len = value.length;
    for (; count < len; count++) {
        var line = value[count];
        if (line.length <= 1 || !line.split(' ')[1] || line.startsWith("#")) continue;
        else break;
    }

    return ++count;
}


function writeExtendibles(path) {
    Object.keys(extendedTypes).forEach(function (i) {
        //Merge file
        fs.appendFileSync(path, extendedTypes[i].join("\n") + "\n");
    });
}


function callback(text) {
    console.log(text);
}

function getObjectsNames(element, targetType) {
    if (element.name){
        return element.name.value===targetType;
    }
}

function normalizeMerged(path, api) {
  if (api==="entity"){
    var file ="merged_schema.graphql"
    var content = fs.readFileSync(path + file, 'utf-8');
    var fileLines = content.toString().split('\n');
    fs.rename(path+file,path + "merged_schema."+"tmp")
    var fileOut = fs.createWriteStream(path+file);
    fileOut.on('error', function(err) { return false/* error handling */ });
    //Iterate until first significant line
    for (var i = 0; i < fileLines.length; i++) {
        var line = fileLines[i];
        // if (line.length <= 1) continue; //Remove empty lines
        var split = line.split(' ');
        // if (!split[1]) continue;
        for (var j = 0; j < split.length; j++) {
          var word = split[j].trim();
          if ((['Access', 'Access!', '[Access]!', '[Access!]', '[Access!]!'].indexOf(word) >= 0) && (word[0]!=="#")) {
            fileLines[i]='#'+line;
            console.log(fileLines[i])
          }
        }
        fileOut.write(fileLines[i]+'\n')
    }
    fileOut.end();


    console.log("Files successfuly normalized");

    return true;
  }
  return false;
}

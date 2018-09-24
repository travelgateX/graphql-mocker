'use strict';


const prompt = require('child_process').spawn;
const fs = require("fs");

var isWin = process.platform === "win32";
var commandPrompt = isWin ? "cmd /c" : "/bin/sh -c";

/**
 * Class Faker, this class is charged of run the faker process
 */
class Faker{

    constructor (schemaPath,  port, extend){
        this.fakerProcess = null;
        this.fakerRunning = false;
        this.cmdToRun = "";
        
        var command ='graphql-faker '+ schemaPath;
        //Add options
        command = (port)   ? command + " -p " + port   : command;
        command = (extend) ? command + " -e " + extend : command;
        this.cmdToRun = command;
    }
    /**
     * Run the faker process
     */
    runFaker(){
        console.log("Running process: " + this.cmdToRun);
        var args = [commandPrompt.split(' ')[1], "'" + this.cmdToRun + "'"];
        var cmd_faker = prompt(commandPrompt.split(' ')[0], args ,{ shell: true , detached: true});
        cmd_faker.stderr.on('data', err => {
            if (err) { 
                
                var errorLogPath = __dirname + "/errors.log"
                if(fs.existsSync(errorLogPath)) fs.unlinkSync(errorLogPath);
                fs.appendFileSync(errorLogPath, err.toString()); 
                throw err.toString(); 
            }
        }); 
        cmd_faker.stdout.on('data', data => {
            console.log(data.toString());
            
        });
        
        this.fakerRunning =true;
        this.fakerProcess=cmd_faker;
        
    }
    /**
     * Check if the process is running
     */
    isRunning(){
        return this.fakerRunning;
    }
    /**
     * Return the process
     */
    getProcess(){
        return this.fakerProcess;
    }
}

/**
 * Create Faker object and run it
 * 
 * @param {Paht of the schema} schemaPath 
 * @param {Port to run the faker} port 
 * @param {Url to extend the schema} extend 
 */
function main(schemaPath, port, extend) {
     //If --h/--help, show help and exit
     if (schemaPath === "--h" || schemaPath === "--help") {
        printFakerHelp();
        return;
    }
    
    var faker =  new Faker(schemaPath, port, extend);
    faker.runFaker();
    return faker;
}


module.exports = {
    main: main,
    Faker: Faker
};
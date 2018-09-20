'use strict';


const prompt = require('child_process').exec;
const { printMockerHelp } = require('./help');
const fs = require("fs");

/**
 * Class Faker, this class is charged of run the faker process
 */
class Faker{

    constructor (schemaPath, callback, port, extend){
        this.fakerProcess = null;
        this.fakerRunning = false;
        this.cmdToRun = "";
        this.callback = callback;

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
        var callback = this.callback;
        var cmd_faker = prompt(this.cmdToRun, function (err, stdout, stderr) {
            if (err) { 
                var errorLogPath = __dirname + "/errors.log"
                if(fs.existsSync(errorLogPath)) fs.unlinkSync(errorLogPath);
                fs.appendFileSync(errorLogPath, stdout); 
                throw stdout; 
            }
            callback(stdout); 
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
 * @param {Callback function} callback 
 * @param {Port to run the faker} port 
 * @param {Url to extend the schema} extend 
 */
function main(schemaPath, callback, port, extend) {
     //If --h/--help, show help and exit
     if (schemaPath === "--h" || schemaPath === "--help") {
        printFakerHelp();
        return;
    }
    var faker =  new Faker(schemaPath, callback, port, extend);
    faker.runFaker();
}


module.exports = {
    main: main,
    Faker: Faker
};
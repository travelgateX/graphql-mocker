'use strict';


const prompt = require('child_process').exec;
const { printMockerHelp } = require('./help');
const fs = require("fs");

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

    runFaker(){
        console.log("Running process: " + this.cmdToRun);
        var cmd_faker = prompt(this.cmdToRun, function (err, stdout, stderr) {
            if (err) { 
                this.callback(err); 
                var errorLogPath = __dirname + "/errors.log"
                if(fs.existsSync(errorLogPath)) fs.unlinkSync(errorLogPath);
                fs.appendFileSync(errorLogPath, err); 
                return; 
            }
            this.callback(stdout); 
        });
        this.fakerRunning =true;
        this.fakerProcess=cmd_faker;
        
    }
    isRunning(){
        return this.fakerRunning;
    }
    getProcess(){
        return this.fakerProcess;
    }
}

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
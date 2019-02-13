const { printFakerHelp } = require('./tools/graph_faker/help');
const { printMockerHelp, printCompleteSchemaHelp, printExtractApiHelp } = require('./tools/graph_mocker/help');

const { printSaverHelp } = require('./tools/graph_saver/help');
const extract_api = require('./tools/graph_mocker/extract_api_schema').main;
const complete_schema = require('./tools/graph_mocker/complete_schema').main;
const fak = require('./tools/graph_faker/gr_faker').main;
const mock = require('./tools/graph_mocker/mocker').main;
const save = require('./tools/graph_saver/saver').main;

var fakers = [];
console.log("Tip: Type 'help' to see possible commands, or '<command> --h|--help' to see <command>'s help");

function exitHandler(options, exitCode) {
    if (options.cleanup){
        console.log('Cleaning process');
        fakers.forEach(faker => {
            var faker_prompt =  faker.getProcess();
            if (faker_prompt!=null){
                process.kill(-faker_prompt.pid);
            }
        });
    } 
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

process.stdout.write(">");
var stdin = process.openStdin();

stdin.addListener("data", function (d) {
    var command = d.toString().trim();
    var splittedCommand = command.split(' ');

    switch (splittedCommand[0]) {
        case "extract_api":
            extract_api(splittedCommand[1], splittedCommand[2]);
            break;
        case "complete_schema":
            complete_schema(splittedCommand[1]);
            break;
        case "fake":
            fakers.push(fak(splittedCommand[1], splittedCommand[2], splittedCommand[3]));
            break;

        case "mock":
            mock(splittedCommand[1], splittedCommand[2]);
            break;

        case "save":
            save(splittedCommand[1]);
            break;

        case "help":
            console.log("CLI commands can be:\n\n");
            printCompleteSchemaHelp();
            printExtractApiHelp();
            printFakerHelp();
            printMockerHelp();
            printSaverHelp();
            break;

        case "q":
        case "Q":
            
            process.exit(0);
        default:
            console.log("Command '" + splittedCommand + "' not recognized.");
    }
    console.log(""); process.stdout.write(">");
});





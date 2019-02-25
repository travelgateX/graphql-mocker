const { mock } = require('../graph_mocker/mocker')
const { printMockerHelp } = require('../graph_mocker/help')

if (!process.argv[2] || !process.argv[3]) { 
    console.log("ERROR: No path or api was provided.");
    printMockerHelp(); 
    return; 
}

var fakers = mock(process.argv[2], process.argv[3]);

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
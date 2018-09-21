const { main } = require('./mocker')

if (!process.argv[2]) { 
    console.log("ERROR: No path was provided.");
    return; 
}
main(process.argv[2], null);
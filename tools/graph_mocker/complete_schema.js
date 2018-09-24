const { main } = require('./mocker')
const printHelp = require('./help').printCompleteSchemaHelp;

function complete_schema(_schema_path){
    if (!_schema_path) { 
        console.log("ERROR: No path was provided.");
        printHelp();
        return; 
    }
    main(_schema_path, null);
}

module.exports = {
    main: complete_schema
}
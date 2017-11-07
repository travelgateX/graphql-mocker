module.exports.printSaverHelp = function() {
    console.log("-> save <directory> [<apiName>]\n");
    console.log("       Saves current schema/s preparing them for commit (splits and removes merge files).\n");
    console.log("           <directory>: Path to the directory containing the schema/s.");
    console.log("           <apiName>: Name of the API that you want to save (by default all merged_schemas are saved).");
    console.log("\n\n")
}
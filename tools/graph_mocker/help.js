module.exports.printMockerHelp = function() {
    console.log("-> mock <directory> [<apiName> [<workingAPIs>]]\n");
    console.log("       Mocks a schema and/or extends it with another one.\n");
    console.log("           <directory>: Path to the directory containing the schema/s.");
    console.log("           <apiName>: Name of the API to extend.");
    console.log("           <workingAPIs>: List of APIs (separated with ',') that will be merged as base APIs (e.g. api1,api2,...,apin)");
    console.log("\n\n")
}
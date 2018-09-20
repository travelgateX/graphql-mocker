module.exports.printMockerHelp = function() {
    console.log("-> mock <directory> [<apiName> <workingAPI>]\n");
    console.log("       Mocks a schema and/or extends it with another one.\n");
    console.log("           <directory>: Path to the directory containing the schema/s.");
    console.log("           <apiPath>: Path of API (example: admin/iam, admin/core ...)");
    console.log("\n\n")
}
module.exports.printMockerHelp = function() {
    console.log("-> mock <directory> <apiPath>\n");
    console.log("       Mocks a schema and/or extends it with another one.\n");
    console.log("           <directory>: Path to the directory containing the schema/s.");
    console.log("           <apiPath>: Path of API (example: admin/iam, admin/core ...)");
    console.log("\n\n")
}

module.exports.printExtractApiHelp = function() {
    console.log("-> extract_api <directory> <apiPath>\n");
    console.log("       Extract complete schema for API with all depends.\n");
    console.log("           <directory>: Path to the directory containing the schema/s.");
    console.log("           <apiPath>: Path of API (example: admin/iam, admin/core ...)");
    console.log("\n\n")
}

module.exports.printCompleteSchemaHelp = function() {
    console.log("-> complete_schema <directory>\n");
    console.log("       Extract complete schema.\n");
    console.log("           <directory>: Path to the directory containing the schema/s.");
    console.log("\n\n")
}
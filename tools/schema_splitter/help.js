module.exports.printSplitHelp = function() {
    console.log("-> split <schemaDir> [<splitDir>]\n");
    console.log("       Splits a GraphQL schema into individual components.\n")
    console.log("           <schemaDir>: Path to the schema to be splitted.");
    console.log("           <splitDir>: Path where 'split' directory will be placed (Current path by default).");
    console.log("\n\n")
}
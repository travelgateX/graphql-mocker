module.exports.printMergeHelp = function() {
    console.log("-> merge <splitDir> [<schemaDir>] [<overWrite>]\n");
    console.log("       Merges a splited GraphQL schema into one.\n");
    console.log("           <splitDir>: Path to the splitted schema directory.");
    console.log("           <schemaDir>: Path where output merged schema has to be placed.");
    console.log("           <overWrite>: Overwrite = 'false': if file already exists, merge the result on it. Overwrite it otherwise. (Default: true)");
    console.log("\n\n")
}
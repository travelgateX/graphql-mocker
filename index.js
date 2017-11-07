const { printSplitHelp } = require('./tools/schema_splitter/help');
const { printMergeHelp } = require('./tools/schema_merger/help');
const { printFakerHelp } = require('./tools/graph_faker/help');
const { printMockerHelp } = require('./tools/graph_mocker/help');
const { printSaverHelp } = require('./tools/graph_saver/help');
const split = require('./tools/schema_splitter/splitter').main;
const merge = require('./tools/schema_merger/merger').main;
const fak = require('./tools/graph_faker/gr_faker').main;
const mock = require('./tools/graph_mocker/mocker').main;
const save = require('./tools/graph_saver/saver').main;

console.log("Tip: Type 'help' to see possible commands, or '<command> --h|--help' to see <command>'s help");

process.stdout.write(">");
var stdin = process.openStdin();

stdin.addListener("data", function (d) {
    var command = d.toString().trim();
    var splittedCommand = command.split(' ');

    switch (splittedCommand[0]) {
        case "split":
            split(splittedCommand[1], splittedCommand[2]);
            break;

        case "merge":
            merge(splittedCommand[1], splittedCommand[2], splittedCommand[3]);
            break;

        case "fak":
            fak(splittedCommand[1]);
            break;

        case "mock":
            mock(splittedCommand[1], splittedCommand[2], splittedCommand[3]);
            break;

        case "save":
            save(splittedCommand[1]);
            break;

        case "help":
            console.log("CLI commands can be:\n\n");
            printSplitHelp();
            printMergeHelp();
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



const extractApiAndDepends = require('../graph_mocker/extract_api_schema').main;

extractApiAndDepends(process.argv[2], process.argv[3]);

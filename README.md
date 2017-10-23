# GraphQL Mocker - GraphQL schema managing tool

`Mocker` integrates several functionalities that can be used in order to get some help during GraphQL schema development/maintenance, specially for team development.


## Quick start
### Neded

- Yarn (https://yarnpkg.com/lang/en/docs/install/)
- NodeJS (https://nodejs.org/es/download/current/)
- 'graphql-faker' (https://github.com/APIs-guru/graphql-faker):
```sh
yarn global add graphql-faker
```

### Usage
**cli**:  `Mocker` cli that integrates all the functionalities. Can be runned by typing:
```sh
yarn run cli
```

**Splitter**: Splits a schema into separated files; one for each defined entity. Files are classified by its entity type.

cli:
```
split <schemaDir> [<splitDir>]
```
Shell:
```sh
yarn run split <schemaDir> [<splitDir>]
```

**Merger**: Merges a splitted schema into one. The split must follow the same structure used for the `splitter` tool.

cli:
```
merge <splitDir> [<schemaDir>] [<overWrite>]
```
Shell:
```sh
yarn run merge <splitDir> [<schemaDir>] [<overWrite>]
```

**Faker**: Runs faker for a given schema.

cli:
```
fak <schemaDir>
```
Shell:
```sh
yarn run fak <schemaDir>
```

**Mocker**: Mocks a given schema; prepares it in Faker.

cli:
```sh
mock <directory> [<apiName>]
```
Shell:
```sh
yarn run mock <directory> [<apiName>]
```

**NOTE:** all of the commands have a help function (--h|--help) where more detailed information is granted.

## Mock use case example:
Let's suppose that we want to work on *Transportation*'s API. What we would like to do is to merge all the other schemas into one, fak them, then merge the *Transportation*'s schema and raise again faker with the new *Transportation*'s schema but this time extending all the other schemas (the last faker raised). To achieve this, we need to have a folder with the following structure*:

```
mocker
 |
 |- APIs
     |
     |- API1
     |- API2
     |- TransportationAPI
     ...
     |- APIn

(Folder names are user election, these are for use case recreation)
```

So with this structure, we only need to run the following command:
```sh
mock ./APIs TransportationAPI
```

This will ignore the folder named "TransportationAPI" for the first merge/fak, and extend it for the second fak based on "TransportationAPI"'s folder.

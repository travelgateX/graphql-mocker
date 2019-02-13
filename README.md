# GraphQL Mocker - GraphQL schema managing tool

`Mocker` integrates several functionalities that can be used in order to get some help during GraphQL schema development/maintenance, specially for team development.


## Quick start
### Requirements

- Yarn (https://yarnpkg.com/lang/en/docs/install/)
- NodeJS (https://nodejs.org/es/download/current/)
- 'graphql-faker' (https://github.com/APIs-guru/graphql-faker):


```sh
yarn global add graphql-faker
```

**IMPORTANT**

Now for use it correctly you need use a graphql-faker from our repository, this is updated to the latest version of graphql

https://github.com/amian84/graphql-faker

For use this, you need local clone the repository, and execute 
```sh
sudo npm link
```
if you have another version installed please remove before. 


<br/>
<br/>

### Usage
**cli**:  `Mocker` cli that integrates all the functionalities. Can be runned by typing:
```sh
yarn run cli
```
<br/>

**Faker**: Runs faker for a given schema.

cli:
```
fake <schemaDir> <port>? <extendSchema>?
```

<br/>

**Mocker**: Mocks a given schema; prepares it in Faker.

cli:
```sh
mock <directory> <apiPath>
```
Shell:
```sh
yarn run mock <directory> <apiPath>
```

<br/>

**Saver**: Saves mocked schemas (splits them and removes merge files).

cli:
```sh
save <directory>
```
Shell:
```sh
yarn run save <directory>
```
<br/>

**Extract API Schema**: Saves complete API schema with his dependencies.

cli:
```sh
extract_api <directory> <apiPath>
```
Shell:
```sh
yarn run extract_api_schema <directory> <apiPath>
```
<br/>

**Complete Schema**: Saves complete schema.

cli:
```sh
complete_schema <directory>
```
Shell:
```sh
yarn run merge_complete_schema <directory>
```
<br/>

**NOTE:** all of the commands have a help function (--h|--help) where more detailed information is granted.

<br/>

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

This will ignore the folder named "TransportationAPI" for the first merge/fak, and 
extend it for the second fak based on "TransportationAPI"'s folder.

<br/>

## About "extend". When should it be used?
As you may know, "extend" clause permits to add some particularities to types existing on the extending schema. For maintenance purposes we will only permit extending certain types from Gateway API (list above). If you extend any other type , you will get an error when running the "save" procedure.
<br/>

[List of extendible types](sourceFile.js)

# ampath-remote-sync-server
Server for ampath incremental remote sync. It is meant to be used with https://github.com/AMPATH/remote-sync-client but it can be used to make periodic mysql dumps.
### To use 
```git clone https://github.com/AMPATH/ampath-remote-sync-server ```

```npm install ```

```Rename the config.json.example to config.json and set your own configurations.```

### Configuration options
1. dumpBase: the folder that will contain the zipped dumpfiles
2. initialCutOff: the datetime where the script will start making dumps before it begins to track the dumps.
3. jwtSecret : not used currently but may be used to secure the meta endpoint with jwt in the future
4. server : an object containing the configuration for the meta endpoint server
5. cron : configuration for https://github.com/ncb000gt/node-cron user to schedule dumps
6. db : configuration for the host and database from which the dumps will be done
7. mysql : configurations for the  database used by the server to track server dumps
8. tables : An array of tables with name and the where clause used to filter the dump data. Use 1 incase you don't wish to filter

### Then

```Create a database called remote_sync and import remote_sync.sql```

Run  ```node server.js``` to generate the sync dumps and serve the meta data endpoint.

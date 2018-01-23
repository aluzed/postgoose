const { Client } = require('pg');
let currentConnection = null;
let dbConf = null;

const localErrors = {
  ConnectionNotInitialized: 'Error, connection must be initialized'
}

module.exports = {
  Connection: {
    /**
    * @entry isConnected
    * @type Function
    *
    * Return if the connection is set or not
    *
    * @return {Boolean}
    */
    isConnected: () => currentConnection !== null,
    /**
    * @entry connect
    * @type Function
    *
    * Copy the connection informations and connect to Postgresql database
    *
    * @param {Object} dbConfig : { host: "...", user: "...", password: "..." }
    */
    connect: (dbConfig) => {
      if (!currentConnection) {
        currentConnection = new Client(dbConfig);
        dbConf = dbConfig;
        currentConnection.connect();
      }
    },
    /**
    * @entry disconnect
    * @type Function
    *
    * Disconnect the socket
    *
    * @throws {ConnectionNotInitialized}
    */
    disconnect: () => {
      if (!currentConnection) throw new Error(localErrors.ConnectionNotInitialized);

      currentConnection.end();
      currentConnection = null;
    },
    /**
    * @entry getConfig
    * @type Function
    *
    * Get the current DB Config
    *
    * @return {Object}
    */
    getConfig: () => dbConf,
    /**
    * @entry getConnection
    * @type Function
    *
    * Return the current connection object
    *
    * @return {Object}
    */
    getConnection: () => currentConnection
  },
  ConnectionErrors: localErrors
}

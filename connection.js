const { Client } = require('pg');
let currentConnection = null;
let dbConf = null;

const localErrors = {
  ConnectionNotInitialized: 'Error, connection must be initialized'
}

module.exports = {
  Connection: {
    /**
     * Return if the connection is set or not
     *
    * @function isConnected
    *
    * @return {Boolean}
    */
    isConnected: () => currentConnection !== null,
    /**
     * Copy the connection informations and connect to Postgresql database
     *
     * @function connect
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
     * Disconnect the socket
     *
     * @function disconnect
     *
     * @throws {ConnectionNotInitialized}
     */
    disconnect: () => {
      if (!currentConnection) throw new Error(localErrors.ConnectionNotInitialized);

      currentConnection.end();
      currentConnection = null;
    },
    /**
     * Get the current DB Config
     *
     * @function getConfig
     *
     * @return {Object}
     */
    getConfig: () => dbConf,
    /**
     * Return the current connection object
     *
     * @function getConnection
     *
     * @return {Object}
     */
    getConnection: () => currentConnection
  },
  ConnectionErrors: localErrors
}

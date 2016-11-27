/**
* @Author: eason
* @Date:   2016-11-27T17:18:01+08:00
* @Email:  uniquecolesmith@gmail.com
* @Last modified by:   eason
* @Last modified time: 2016-11-27T20:56:01+08:00
* @License: MIT
* @Copyright: Eason(uniquecolesmith@gmail.com)
*/

const createModel = require('./createModel');
const createController = require('./createController');
const createRoute = require('./createRoute');
const createApp = require('./createApp');

const PORT = process.env.PORT || 8080;

class Eva {
  constructor ({
    prefix='/api/v1'
  }={}) {
    this.app = createApp();
    this.appConfig = {
      prefix,
    };

    this.apps = {}; // save apps
  }

  route (...args) {
    this.app.use(...args);
  }

  model (appName, appStructureDefinition, options) {
    if (this.apps.hasOwnProperty(appName)) {
      console.error(`App {${appName}} has already exist.`);
      process.exit();
    }

    const newApp = {
      // appName,
      appStructureDefinition,
      appRoute: createRoute(
        createController(
          createModel(appName, appStructureDefinition, options)
        )
      ),
      appMiddlewares: []
    };

    Object.assign(this.apps, { [appName]: newApp });

    this.route(
      `${this.appConfig.prefix}/${appName}`,
      // ...newApp.appMiddlewares,
      newApp.appRoute
    );
  }

  run () {
    // console.log(this.apps);
    this.app.listen(PORT, "127.0.0.1", err => {
      if (err) {
        console.log(err);
      } else {
        console.log('Server start at port: ' + PORT);
      }
    });
  }
}


module.exports = Eva;

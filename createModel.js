/**
* @Author: eason
* @Date:   2016-11-26T12:00:18+08:00
* @Email:  uniquecolesmith@gmail.com
* @Last modified by:   eason
* @Last modified time: 2016-11-27T21:03:54+08:00
* @License: MIT
* @Copyright: Eason(uniquecolesmith@gmail.com)
*/

const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

module.exports = function createModel (appName, appStructureDefinition, options={timestamps: true}) {
  const schema = new mongoose.Schema(appStructureDefinition, options);
  return mongoose.model(appName, schema);
}

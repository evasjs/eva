/**
* @Author: eason
* @Date:   2016-11-26T11:15:14+08:00
* @Email:  uniquecolesmith@gmail.com
* @Last modified by:   eason
* @Last modified time: 2016-11-27T21:01:01+08:00
* @License: MIT
* @Copyright: Eason(uniquecolesmith@gmail.com)
*/

const Router = require('express').Router;

module.exports = function createRoute(controller) {
  router = Router();

  router
    .route('/')
    .all((req, res, next) => {
      req.locals = {
        offset: parseInt(req.query.offset) || 0,
        count: parseInt(req.query.count) || 10,
      };
      next();
    })
    .get(controller.list)
    .post(controller.create);

  router
    .route('/:id')
    .all((req, res, next) => {
      req.locals = {};
      next();
    })
    .get(controller.retrieve)
    .put(controller.update)
    .delete(controller.delete);

  return router;
}

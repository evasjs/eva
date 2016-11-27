/**
* @Author: eason
* @Date:   2016-11-26T12:07:27+08:00
* @Email:  uniquecolesmith@gmail.com
* @Last modified by:   eason
* @Last modified time: 2016-11-27T21:03:21+08:00
* @License: MIT
* @Copyright: Eason(uniquecolesmith@gmail.com)
*/

module.exports = function createController (model) {
  const {paths} = model.schema;

  const list = (req, res, next) => {
      const {
        offset=0, count=10, query={},
        sort={}, select={}, populate={},
      } = req.locals;

      model
        .count(query)
        .exec((err, total) => {
          if (err) return next(err);

          model
            .find(query)
            .skip(offset)
            .limit(count)
            .sort(sort)
            .select(select)
            // .populate(populate)
            .lean()
            .exec((err, data) => {
              if (err) return next(err);

              const realCount = data.length;

              return res
                      .status(200)
                      .json({
                        offset,
                        count: realCount,
                        total,
                        data
                      });
            })
        });
    };

  const create = (req, res, next) => {
      const _object = {};
      const _raw = req.body;

      Object
        .keys(_raw)
        .forEach(key => {
          if (paths.hasOwnProperty(key)) {
            Object.assign(_object, {[key]: _raw[key]});
          }
        });

      const object = new model(_object);
      object.save((err, ob) => {
        return err ? next(err) : res.status(201).json(ob);
      });
    };

  const retrieve = (req, res, next) => {
      const {id} = req.params;
      const {
        select={},
        populate={}
      } = req.locals;

      model
        .findOne({_id: id})
        // .populate(populate)
        .select(select)
        .exec((err, object) => {
          return err ? next(err) : res.json(object);
        });
    };

  const update = (req, res, next) => {
      const {id} = req.params;

      model
        .findOne({_id: id})
        .exec((err, object) => {
          if (err) return next(err);

          const _raw = req.body;
          const _object = {};
          Object
            .keys(_raw)
            .forEach(key => {
              if (paths.hasOwnProperty(key)) {
                Object.assign(_object, {[key]: _raw[key]});
              }
            });

          object
            .update(_object, (err, status) => {
              return err ? next(err) : res.json(_object);
            });
        });
    };

  const del = (req, res, next) => {
      const {id} = req.params;

      return model
              .remove({_id: id})
              .exec((err, object) => {
                return err ? next(err) : res.status(204).json(object);
              });
    };

  return {list, create, retrieve, update, delete: del};
}

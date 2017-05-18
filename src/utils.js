/**
 * @Author: eason
 * @Date:   2017-05-18T23:37:50+08:00
 * @Last modified by:   eason
 * @Last modified time: 2017-05-19T01:08:42+08:00
 */
import invariant from 'invariant';

export function mapFnObject(object, wrapper) {
  const t = {};

  Object.keys(object).forEach((name) => {
    t[name] = wrapper(name, object[name]);
  });

  return t;
}

export function mapObject(object, wrapper) {
  const t = {};

  Object.keys(object).forEach((name) => {
    t[name] = wrapper(name, object[name]);
  });

  return t;
}

export function createMethod(methodObject, namespace, name) {
  const [ns, handlerName, userUseColon] = name.split(':');
  let rNs = namespace;
  let rHn = handlerName;

  // current namespace method
  if (handlerName === undefined) {
    rHn = name;
  } else {
    rNs = ns;
    rHn = userUseColon.length ? `${rHn}:${userUseColon.join(':')}` : rHn;
  }

  invariant(
    methodObject[rNs][rHn],
    `Check whether method ${rHn} has already register in ${rNs}`,
  );

  return methodObject[rNs][rHn]
    ? methodObject[rNs][rHn]
    : (req, res, next) => next();
}

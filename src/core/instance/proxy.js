/* not type checking this file because flow doesn't play well with Proxy */

import config from 'core/config'
import { warn, makeMap, isNative } from '../util/index'

let initProxy

if (process.env.NODE_ENV !== 'production') {
  const allowedGlobals = makeMap(
    'Infinity,undefined,NaN,isFinite,isNaN,' +
    'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
    'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
    'require' // for Webpack/Browserify
  )

  const warnNonPresent = (target, key) => {
    warn(
      `Property or method "${key}" is not defined on the instance but ` +
      'referenced during render. Make sure that this property is reactive, ' +
      'either in the data option, or for class-based components, by ' +
      'initializing the property. ' +
      'See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.',
      target
    )
  }

  const warnReservedPrefix = (target, key) => {
    warn(
      `Property "${key}" must be accessed with "$data.${key}" because ` +
      'properties starting with "$" or "_" are not proxied in the Vue instance to ' +
      'prevent conflicts with Vue internals' +
      'See: https://vuejs.org/v2/api/#data',
      target
    )
  }

  const hasProxy =
    typeof Proxy !== 'undefined' && isNative(Proxy)

  if (hasProxy) {
    // 将字符串中的数据转为数组
    const isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta,exact')
    config.keyCodes = new Proxy(config.keyCodes, {
      // 赋值拦截
      set (target, key, value) {
        if (isBuiltInModifier(key)) {
          // 如果赋值的属性在isBuiltInModifier中则进行报错
          warn(`Avoid overwriting built-in modifier in config.keyCodes: .${key}`)
          return false
        } else {

          // 成功赋值
          target[key] = value
          return true
        }
      }
    })
  }

  const hasHandler = {
    // 遍历拦截
    has (target, key) {
      // 判断key是否存在于目标当中
      const has = key in target
      // 如果为保留的属性 或者为开头为_且目标$data中不存在的属性
      const isAllowed = allowedGlobals(key) ||
        (typeof key === 'string' && key.charAt(0) === '_' && !(key in target.$data))
      // 既不在目标对象及其原型链上，也不是被允许的key
      if (!has && !isAllowed) {
        // 如果key存在于目标$data, 抛出保留前缀警告
        if (key in target.$data) warnReservedPrefix(target, key)
        // 抛出非存在性警告
        else warnNonPresent(target, key)
      }
      // 存在且不为保留属性的可被遍历
      return has || !isAllowed
    }
  }

  const getHandler = {
    // 取值拦截
    get (target, key) {
      // 如果数据key为字符串，且在目标中无法取得
      if (typeof key === 'string' && !(key in target)) {
        // 如果key存在于目标$data, 抛出保留前缀警告
        if (key in target.$data) warnReservedPrefix(target, key)
        // 抛出非存在性警告
        else warnNonPresent(target, key)
      }
      // 取出数据
      return target[key]
    }
  }
/*
如果存在内置对象Proxy，则对实例对象进行代理，否则返回实例对象
如果参数中存在render，则进行取值拦截，否则进行遍历拦截
遍历代理的句柄为：如果值存在于目标对象上且不为保留属性，则返回，否则根据情况报错
取值代理的句柄为：如果属性存在于$data中则抛出保留前缀错误，取不到且不存在$data中则进行不存在报错，可以取值时直接返回
*/
  initProxy = function initProxy (vm) {
    // Proxy为内置对象
    if (hasProxy) {
      // determine which proxy handler to use
      const options = vm.$options
      // render且render的_withStripped属性存在 则拦截句柄为取值拦截，否则为遍历拦截
      const handlers = options.render && options.render._withStripped
        ? getHandler
        : hasHandler
      // 对vm进行代理
      vm._renderProxy = new Proxy(vm, handlers)
    } else {
      // proxy不存在则将_renderProxy属性设置为其vm实例自身
      vm._renderProxy = vm
    }
  }
}

export { initProxy }

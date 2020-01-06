/*
 * @Author: your name
 * @Date: 2019-03-05 16:01:36
 * @LastEditTime: 2020-01-03 21:21:49
 * @LastEditors: your name
 * @Description: In User Settings Edit
 * @FilePath: /vue/src/core/instance/index.js
 */
import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  // 非生产环境时，如果上下文环境不是Vue实例则进行报错
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  // 用参数进行实例的初始化
  this._init(options)
}

// 向Vue原型链中挂载_init方法（用于实例的初始化）
initMixin(Vue)
// 进行实例的数据代理
// 并向原型链中挂载$set,$delete,$watch
stateMixin(Vue)
// 向原型链上挂载$on,$once,$off,$emit方法
eventsMixin(Vue)
// 向原型链上挂载_update,$forceUpdate,$destroy方法
lifecycleMixin(Vue)
// 向原型链上挂载$nextTick,_render方法
renderMixin(Vue)

export default Vue

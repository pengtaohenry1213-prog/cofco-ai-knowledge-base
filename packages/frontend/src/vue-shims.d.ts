// Vue 3 单文件组件类型声明
declare module '*.vue' {
  import type { DefineComponent, ComponentOptions } from 'vue';
  const component: DefineComponent<object, object, unknown> | ComponentOptions;
  export default component;
}

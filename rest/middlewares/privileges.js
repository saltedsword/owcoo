import { UserModel, UserGroupModel } from '../models/index';

export default async (ctx, next) => {
  const noFilters = ['/user/login', '/user/logout', '/user/logInfo', '/uploadForElement'];

  if (ctx.url.startsWith('/front/')) return await next();
  
  for (let i=0; i<noFilters.length; i++) {
    if (ctx.url === noFilters[i]) return await next();
  }
  // // 操作权限
  // let user = ctx.session.user;
  // user = await UserModel.findForGroup(user._id);
  
  // let options = user.userGroup.optionPrivileges;
  // if (!option || !options || options.length == 0 || !_.includes(options, option)) {
  //   ctx.noPrivileges();
  //   return false;
  // }
  // if (arguments.length === 2)
  //   return true;
  // // 具体的栏目权限 (有些操作不涉及栏目，所以column可为空)
  // let columns = user.userGroup.columnPrivileges;
  // if (!column || column.length == 0 || !columns || columns.length == 0) {
  //   ctx.noPrivileges();
  //   return false;
  // }
  // // 栏目可以是单个 也可以是 数组
  // if (!(column instanceof Array)) {
  //   if (_.includes(columns, column)) return true;
  // } else {
  //   // 是数组时，只要其中一个元素满足条件，就算通过
  //   for (let i=0; i<column.length; i++) {
  //     if (_.includes(columns, column[i])) return true;
  //   }
  // }
  // ctx.noPrivileges();

  const user = await UserModel.findById(ctx.uid);
  if (!user.userGroup) return ctx.noPrivileges();

  const userGroup = await UserGroupModel.fetchForResources(user.userGroup);
  if (!userGroup) return ctx.noPrivileges();

  const urls = [];
  userGroup.resources.forEach(el => {if(el.type === '2') urls.push(el.url) });

  for (let i in urls) {
    // 同时要兼顾到 初始化的接口，比如save 对应一个saveInit
    // 还要注意 save/:id 或者 del/:id这种的
    // 所以先简单的比较下
    if (ctx.url.indexOf(urls[i]) > -1) 
      return await next();
  }
  
  return ctx.noPrivileges();
}
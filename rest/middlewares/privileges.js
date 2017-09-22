import { UserModel, UserGroupModel } from '../models/index';

export default async (ctx, next) => {
  const noFilters = ['/user/login', '/user/logout', '/user/logInfo', '/uploadForElement'];

  if (ctx.url.startsWith('/front/')) return await next();
  
  for (let i=0; i<noFilters.length; i++) {
    if (ctx.url === noFilters[i]) return await next();
  }

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
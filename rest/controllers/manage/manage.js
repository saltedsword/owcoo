'use strict';
import { ColumnModel, CodelistModel, UserGroupModel } from '../../models/index';
import ModuleControllers from '../modules/';
import ModuleModels from '../../models/modules/';
import _ from 'lodash';

class Manage {
    //管理页面 首页   前台参数 c = module 或者 column 按模块或者栏目查询
    static async manageInit(ctx) {
        if (ctx.query.c == 'column') {
            return await Manage.columnQuery(ctx);
        } else {
            let modules = await CodelistModel.find({key: 'module'}, {_id:0, value: 1, text: 1}).sort('sort');
            let result = modules.map(item => {
                return {
                    name: item.text,
                    url: `/admin/${item.value}List`,
                    module: item.value
                };
            });
            return ctx.success(result);
        }
        
    }

    //管理页面 第二页   前台参数 manage/module/:id 或者 manage/column/:id 按模块或者栏目查询

    //如果是按模块,根据模块id返回该模块下的记录列表
    static async moduleQuery(ctx) {
        let data = [];
        let id = ctx.query.id;
        if (!id) return ctx.errorArguments();
        let Controller = ModuleControllers[id];
        if (!Controller) return ctx.errorArguments();
        ctx.successMsg('');
    }
    //如果是按栏目
    //如果该栏目深度为3，且二级栏目存在多种模块，则只显示所有二级栏目图标，且其url为 manage/column/:id
    //如果模块类型为 summary且已经是最后一级菜单， 则如果已经存在，返回保存（是新增还是修改 由是否有id定）页面
    //否则 返回列表页面
    //返回：{
    //   pageType: save、list、columns 表示返回的是保存页面 还是 列表页面 还是 栏目图标页面
    //   id: 保存页面的目标id
    //   column：栏目id，用于columns,还有list（需要递归子节点）
    // }
    static async columnQuery(ctx) {
        const data = [];
        const id = ctx.params.id;
        const s = ctx.query.s;
        let columns = [];
        
        s ? columns = await ColumnModel.find({name: {$regex : new RegExp(s, 'i')}}) 
        : columns = await ColumnModel.fetchChildren(id);

        if (columns.length == 0) {
            return ctx.success([]);
        }
        let result = [];
        for (let i=0; i<columns.length; i++) {
            let column = columns[i];
            let hasLevel = await ColumnModel.hasLevel(column._id);
            let Model = ModuleModels[column.module];
            // 保存页面
            if (hasLevel == 1) {
              if (column.module == 'summary') {
                let summary = await Model.findOne({column: column._id});
                let id = summary ? summary._id : '';
                result.push({
                    name: column.name,
                    url: `/admin/saveSummary/${id}`,
                    module: column.module
                });
                continue;
              }
            }
            if (hasLevel == 2 || hasLevel == 3){
              let flag = false;
              let children = await ColumnModel.fetchChildren(column._id);
              //栏目图标页面。还在当前页面，需要返回图标所需值
              for (let i=0; i<children.length; i++) {
                if (children[i].module != column.module) {
                  flag = true;
                  result.push({
                    name: column.name,
                    url: `/admin/manage/${column._id}?c=column`,
                    module: column.module,
                    click: true,
                    search: `/${column._id}?c=column`
                  });
                  break;
                }
              }
              if(flag) continue;
            }

            //列表页面，需要模块类型和栏目id（需要递归子节点
          result.push({
            name: column.name,
            url: `/admin/${column.module}List?column=${column._id}`,
            module: column.module
          });
        }
        return ctx.success(result);
    }
}

export default Manage;
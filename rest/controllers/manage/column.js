'use strict';
import { ColumnModel, CodelistModel, SummaryModel } from '../../models/index';
import { Article, Dowload, Picture, Product, Summary } from '../index';
import _ from 'lodash';

class Column {
    //首页初始化
    static async init(ctx) {
        // if (!privileges(ctx, OPTIONS.QUERY)) return;

        async function initColumn(parent, result) {
            let columns = await ColumnModel.fetchChildren(parent._id);
            if (!columns || columns.length === 0) {
                delete parent.children;
            }
            for (let i=0; i < columns.length; i++) {
                let child = {
                    _id: columns[i]._id,
                    name: columns[i].name,
                    sort: columns[i].sort,
                    display: columns[i].display,
                    // displayName: await CodelistModel.getCodeText('display', columns[i].display),
                    module: columns[i].module,
                    moduleName: await CodelistModel.getCodeText('module', columns[i].module),
                    children: [],
                    options: {}
                };
                //操作设置
                //如果是一级栏目，则具有 添加子栏目操作
                //如果不是一级栏目，或者是一级栏目并且其没有三级栏目，则具有 移动栏目至的操作
                //如果hasLevel是2，如果该栏目和其子栏目模块不匹配（规则上，该栏目一定是顶级栏目），则没有 移动栏目至的操作
                let childrens2 = await ColumnModel.fetchChildren(child._id);
                if (!parent._id) {
                    child.options['append'] = '添加子栏目';
                    if (!childrens2 || childrens2.length ==0) {
                        child.options['move'] = '移动栏目至';
                    } else {
                        let flag = true;
                        for (let j=0; j<childrens2.length; j++) {
                            // 如果一级栏目和二级栏目模块不匹配，则没有移动栏目的操作
                            if (child.module != childrens2[j].module) {
                                flag = false;
                                break;
                            }
                            // 如果有三级栏目，则 没有移动栏目的操作
                            let childrens3 = await ColumnModel.fetchChildren(childrens2[j]._id);
                            if (childrens3.length > 0) {
                                flag = false;
                                break;
                            }
                        }
                        if (flag) {
                            child.options['move'] = '移动栏目至';
                        }
                    }
                }
                //如果是二级栏目，则具有 添加三级栏目操作
                //如果是二级以上栏目，则一定具有移动的操作
                else if (parent._id) {
                    if (!(await ColumnModel.findById(parent._id)).parent)
                        child.options['append'] = '添加子栏目';
                    child.options['move'] = '移动栏目至';
                }
                //如果栏目下没有子栏目则具有 删除 操作
                if (!childrens2 || childrens2.length == 0) {
                    child.options['del'] = '删除';
                }

                parent.children[i] = child;
                if (!parent._id) {
                    result.push(child);
                }
                await initColumn(child);
            }
        }
        let parent = {
            _id: null,
            children: []
        }
        let result = [];
        await initColumn(parent, result);
        ctx.success({
            data: result, 
            display: await CodelistModel.getCodes('display'),
            module: await CodelistModel.getCodes('module')
        });
    }
    //保存初始化
    static async saveInit(ctx) {
        let id = ctx.params.id;
        let result = {};
        result.displays = await CodelistModel.getCodes('display');
        result.modules = await CodelistModel.getCodes('module');
        ctx.success(result);
    }
    //保存
    static async save(ctx) {
        let column = ctx.request.body.column;
        let id = column._id;
        // if (!id && !privileges(ctx, OPTIONS.ADD) || id && !privileges(ctx, OPTIONS.UPDATE)) return;
        if (!column) {
            console.log('参数传递错误！');
            ctx.errorArguments();
            return;
        }
        if (!column.name || !column.display || !column.sort || (!column._id && !column.module)) {
            console.log('有必填项未填，请检查！');
            ctx.errorMsg('有必填项未填，请检查！');
            return;
        }
        if (!Number(column.sort)) {
            console.log('sort只能是数字！');
            ctx.errorMsg('sort只能是数字！');
            return;
        }
        if (!id && !column.parent) {
            column.parent = null;
        }
        if (await ColumnModel.isAncestors(column._id, column.parent)) {
            console.log('不能将目标菜单及其子孙菜单作为目标菜单的父菜单！');
            ctx.errorMsg('不能将目标菜单及其子孙菜单作为目标菜单的父菜单！');
            return;
        }

        if (await ColumnModel.getLevel(column.parent) > 2) {
            console.log('父栏目层级最多为2！');
            ctx.errorMsg('父栏目层级最多为2！');
            return;
        }
        if (await ColumnModel.getLevel(column.parent) == 2) {
            let pColumn = await ColumnModel.findById(column.parent);
            if (pColumn.module != column.module) {
                console.log('如果父栏目是二级栏目，则目标栏目的模块类型必须和它一致！');
                ctx.errorMsg('如果父栏目是二级栏目，则目标栏目的模块类型必须和它一致！');
                return;
            }
        }
        if (await ColumnModel.findByName(column.name, id)) {
            console.log('已存在相同的栏目名！');
            ctx.errorMsg('已存在相同的栏目名！');
            return;
        }
        if (id) {
            let _column = await ColumnModel.findById(id);
            column = _.assign(_column, column);
            column.meta.updater = ctx.uid;
            column = await column.save();
        } else {
            delete column._id;
            column = new ColumnModel(column);
            column.meta.creater = ctx.uid;
            column = await column.save();
            // 如果是简介模块，则新建栏目成功后，还要初始化 简介详情
            if (column.module === 'summary') {
                const summary = new SummaryModel({column: column._id});
                await summary.save();
            }
        }
        await Column.init(ctx);
        return ctx.body.msg = '保存成功！';
    }
    //移动初始化,获取可移动的所有栏目的树
    //如果目标栏目是一级且其最大层级为3，则无法移动
    //否则，目标栏目所能移动的范围是 父栏目所在层级+目标栏目最大层级 之和小于等于3 并且 如果父栏目层级为2时，目标栏目的模型需匹配
    //父栏目为1层时，如果目标栏目有子栏目，则目标栏目和其子栏目必须保证 模型匹配     
    static async moveInit(ctx) {
        let id = ctx.params.id;
        // if (!privileges(ctx, OPTIONS.UPDATE)) return;
        let column = await ColumnModel.findById(id);
        let level = await ColumnModel.getLevel(column._id);
        let hasLevel = await ColumnModel.hasLevel(column._id);
        column.hasLevel = hasLevel;
        // 如果目标层级为2，则查出其子栏目，留作后面判断用
        if (column.hasLevel == 2) {
            column.children = await ColumnModel.fetchChildren(id);
        }
        let result = [];
        //如果目标栏目是一级且其最大层级为3，则无法移动
        if (level==1 && hasLevel >= 3) {
            return ctx.success(result);
        }
        //添加升为一级栏目选项
        if (level > 1)
            result.push({ _id: 'top', name: '升为一级栏目' });
        async function initColumn(parent, result, target) {
            // console.log(target.hasLevel)
            let columns = await ColumnModel.fetchChildren(parent._id);
            if (!columns || columns.length === 0) {
                delete parent.children;
            }
            for (let i=0; i < columns.length; i++) {
                let child = {
                    _id: columns[i]._id,
                    name: columns[i].name
                }
                //排除自己和子孙及父栏目，另除非父栏目层级为1，才有必要递归出同胞栏目
                if (await ColumnModel.isAncestors(target._id, child._id)) {
                    continue;
                }
                let level = await ColumnModel.getLevel(child._id);
                if (child._id+'' == target.parent) {
                    if(level == 1) await initColumn(child, result, target);
                    continue;
                }
                
                let hasLevel = target.hasLevel;
                if ((level + hasLevel) <= 3) {//组合后的层数 不能超过3
                    //如果父栏目是2级，且目标栏目的模块不匹配，则跳过
                    if (level == 2 && columns[i].module != target.module) {
                        continue;
                    }
                    //父栏目为1层时，如果目标栏目有子栏目，且它们模型不匹配，则跳过
                    if (level == 1 && hasLevel == 2) {
                        let flag = false;
                        for (let j=0; j<target.children.length; j++) {
                            if (target.module != target.children[j].module) {
                                flag = true;
                                break;
                            }
                        }
                        if(flag) continue;
                    }

                    //挂载节点操作
                    parent.children = parent.children || [];
                    parent.children.push(child);
                    if (!parent._id) {
                        result.push(child);
                    } else {

                        let flag = true;
                        for (let i in result) {
                            if (result[i]._id.toString() == parent._id.toString()) {
                                flag = false;
                                break;
                            }
                        }
                        if(flag) result.push(child);
                    }
                    //如果父栏目层级是1，则有必要递归
                    if (level == 1) {
                        await initColumn(child, result, target);
                    }
                }
            }
        }
        let parent = {
            _id: null,
            children: []
        }
        await initColumn(parent, result, column);
        
        return ctx.success({moveInit: result});
    }
    //移动
    static async move(ctx) {
        // if (!privileges(ctx, OPTIONS.UPDATE)) return;
        let cl = ctx.request.body.column;
        let column = await ColumnModel.findById(cl._id);
        if (!cl.parent) {
            return ctx.errorArguments();
        }
        column.parent = cl.parent === 'top' ? null : cl.parent;
        let level = await ColumnModel.getLevel(column.parent);
        let hasLevel = await ColumnModel.hasLevel(column._id);
        if (await ColumnModel.isAncestors(column._id, column.parent)) {
            console.log('不能将目标菜单及其子孙菜单作为目标菜单的父菜单！');
            ctx.errorMsg('不能将目标菜单及其子孙菜单作为目标菜单的父菜单！');
            return;
        }
        if (level > 2) {
            console.log('父栏目层级最多为2！');
            ctx.errorMsg('父栏目层级最多为2！');
            return;
        }
        if ((level+hasLevel) > 3) {
            console.log('父栏目层级和目标栏目最大层级之和不能大于3！');
            ctx.errorMsg('父栏目层级和目标栏目最大层级之和不能大于3！');
            return;
        }
        if (level == 2) {
            let pColumn = await ColumnModel.findById(column.parent);
            if (pColumn.module != column.module) {
                console.log('如果父栏目是二级栏目，则目标栏目的模块类型必须和它一致！');
                ctx.errorMsg('如果父栏目是二级栏目，则目标栏目的模块类型必须和它一致！');
                return;
            }
        } else {    //父栏目为1层时，如果目标栏目有子栏目，且它们模型不匹配，则跳过
            if (hasLevel == 2) {
                let children = await ColumnModel.fetchChildren(column._id);
                for (let j=0; j<children.length; j++) {
                    if (column.module != children[j].module) {
                        console.log('移动后的二级栏目与三级栏目模型必须一致！');
                        ctx.errorMsg('移动后的二级栏目与三级栏目模型必须一致！');
                        return;
                    }
                }
            }
        }
        
        column.meta.updater = ctx.uid;
        column = await column.save();

        await Column.init(ctx);
        return ctx.body.msg = '移动栏目成功！';
    }
    //删除
    static async del(ctx) {
        let id = ctx.params.id;
        let result = {};
        if (id) {
            if (!await ColumnModel.findById(id)) {
                ctx.errorMsg('该栏目不存在或已删除！');
                return
            }
            if (await ColumnModel.hasChildren(id)) {
                console.log('该菜单有子菜单，无法删除');
                ctx.errorMsg('该菜单有子菜单，无法删除');
                return;
            }
            if (await ColumnModel.hasRecords(id)) {
                console.log('该栏目下还有数据记录，无法删除');
                ctx.errorMsg('该栏目下还有数据记录，无法删除');
                return;
            } 
            await SummaryModel.remove({column: id});
            let column = await ColumnModel.remove({_id: id});

            await Column.init(ctx);
            return ctx.body.msg = '删除成功！';
        }
        ctx.errorArguments();
    }
    //树初始化
    static async tree(ctx) {
        async function initColumn(parent, result) {
            let columns = await ColumnModel.fetchChildren(parent._id);
            if (!columns || columns.length === 0) {
                delete parent.children;
            }
            for (let i=0; i < columns.length; i++) {
                let child = {
                    _id: columns[i]._id,
                    name: columns[i].name,
                    children: []
                }
                parent.children[i] = child;
                if (!parent._id) {
                    result.push(child);
                }
                await initColumn(child);
            }
        }
        let parent = {
            _id: null,
            children: []
        }
        let result = [];
        await initColumn(parent, result);
        ctx.success(result);
    }
    // 用于发布页面，树的展现
    static async releaseInit(ctx) {
        ctx.success(await ColumnModel.fetchByModule());
    }

    // 用于发布页面，根据column的id 得到对应的 模块的保存页面url
    static async getReleaseUrl(ctx) {
        if (!ctx.query.id) return ctx.errorArguments();

        const column = await ColumnModel.findById(ctx.query.id);
        if (!column || !column.module) return ctx.errorArguments();
        const url = '/admin/save' + column.module[0].toUpperCase() + column.module.slice(1) + '?c=' + ctx.query.id;
        ctx.success({pushUrl: url});
    }
}

export default Column;
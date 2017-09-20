'use strict';
import { UserGroupModel, CodelistModel, Page, ResourceModel } from '../../models/index';
import _ from 'lodash';

class UserGroup {
    // 分页查询，可指定 页面尺寸，目标页面，关键字过滤，按字段排序
    // 查询时，要根据查询人的权限，限制其查询的结果
    static async list(ctx) {
        let query = ctx.request.query || {} ;

        let page = new Page(query);
        
        await UserGroupModel.listByPage(page);
        
        ctx.success({currentPage: page.currentPage, total: page.totalCount, data: page.list});
    }
    //保存初始化
    static async saveInit(ctx) {
        let id = ctx.params.id;
        // if (!id && !privileges(ctx, OPTIONS.ADD) || id && !privileges(ctx, OPTIONS.UPDATE)) return;
        let result = {};
        if (id) {
          result.userGroup = await UserGroupModel.findOne({_id: id}, {meta: 0, __v: 0});
          result.treeData = await ResourceModel.fetchForTree();
        }
        
        ctx.success(result);
    }
    //保存
    static async save(ctx) {
        let userGroup = ctx.request.body.userGroup;
        let id = userGroup._id;
        // if (!id && !privileges(ctx, OPTIONS.ADD) || id && !privileges(ctx, OPTIONS.UPDATE)) return;
        if (!userGroup) {
            console.log('参数传递错误！');
            ctx.errorArguments();
            return;
        }
        if (!userGroup.name) {
            console.log('有必填项未填，请检查！');
            ctx.errorMsg('有必填项未填，请检查！');
            return;
        }

        if (await UserGroupModel.findByName(userGroup.name, id)) {
            console.log('已存在相同的用户组名！');
            ctx.errorMsg('已存在相同的用户组名！');
            return;
        }
        if (id) {
            let _userGroup = await UserGroupModel.findById(id);
            userGroup = _.assign(_userGroup, userGroup);
            userGroup.meta.updater = ctx.uid;
            userGroup = await userGroup.save();
        } else {
            delete userGroup._id;
            userGroup = new UserGroupModel(userGroup);
            userGroup.meta.creater = ctx.uid;
            userGroup = await userGroup.save();
        }
        await UserGroup.list(ctx);
        return ctx.body.msg = '保存成功！';
    }
    //删除
    static async del(ctx) {
        // if (!privileges(ctx, OPTIONS.DELETE)) return;
        let id = ctx.params.id;
        let result = {};
        if (id) {
            if (!await UserGroupModel.findById(id)) {
                ctx.errorMsg('该用户组不存在或已删除！');
                return
            }
            if (await UserGroupModel.hasUser(id)) {
                console.log('该用户组下存在用户，无法删除');
                ctx.errorMsg('该用户组下存在用户，无法删除');
                return;
            } else {
                let userGroup = await UserGroupModel.remove({_id: id});

                await UserGroup.list(ctx);
                return ctx.body.msg = '删除成功！';
            }
        }
        ctx.errorArguments();
    }
}

export default UserGroup;
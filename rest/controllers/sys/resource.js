'use strict';
import { ResourceModel, CodelistModel } from '../../models/index';
import _ from 'lodash';

class Resource {
    //树初始化
    static async list(ctx) {
        // if (!privileges(ctx, OPTIONS.QUERY)) return;
        let result = await ResourceModel.fetchForTree();
        ctx.success({data: result});
    }
    //保存初始化
    static async saveInit(ctx) {
        let id = ctx.params.id;
        // if (!id && !privileges(ctx, OPTIONS.ADD) || id && !privileges(ctx, OPTIONS.UPDATE)) return;
        let result = {};
        result.resourceType = await CodelistModel.getCodes('resourceType');
        if (id) result.resource = await ResourceModel.findOne({_id: id}, {meta: 0, __v: 0});
        ctx.success(result);
    }
    //保存
    static async save(ctx) {
        let resource = ctx.request.body.resource;
        let id = resource._id;
        // if (!id && !privileges(ctx, OPTIONS.ADD) || id && !privileges(ctx, OPTIONS.UPDATE)) return;
        if (!resource) {
            console.log('参数传递错误！');
            ctx.errorArguments();
            return;
        }
        if (!resource.name || !resource.type) {
            console.log('有必填项未填，请检查！');
            ctx.errorMsg('有必填项未填，请检查！');
            return;
        }

        if (!resource.parent) {
            resource.parent = null;
        }
        
        if (await ResourceModel.findByName(resource.name, id)) {
            console.log('已存在相同的资源名！');
            ctx.errorMsg('已存在相同的资源名！');
            return;
        }
        if (id) {
            let _resource = await ResourceModel.findById(id);
            resource = _.assign(_resource, resource);
            resource.meta.updater = ctx.uid;
            resource = await resource.save();
        } else {
            delete resource._id;
            resource = new ResourceModel(resource);
            resource.meta.creater = ctx.uid;
            resource = await resource.save();
        }
        await Resource.list(ctx);
        return ctx.body.msg = '保存成功！';
    }
    //删除
    static async del(ctx) {
        // if (!privileges(ctx, OPTIONS.DELETE)) return;
        let id = ctx.params.id;
        let result = {};
        if (id) {
            if (!await ResourceModel.findById(id)) {
                ctx.errorMsg('该资源不存在或已删除！');
                return
            }
            if (await ResourceModel.hasChildren(id)) {
                console.log('该菜单有子菜单，无法删除');
                ctx.errorMsg('该菜单有子菜单，无法删除');
                return;
            } else {
                let resource = await ResourceModel.remove({_id: id});
                // 同步更新用户组中 资源权限集合
                // UserGroupModel.removeResource(id);

                await Resource.list(ctx);
                return ctx.body.msg = '删除成功！';
            }
        }
        ctx.errorArguments();
    }
}

export default Resource;
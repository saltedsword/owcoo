'use strict';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt-nodejs';
const Schema = mongoose.Schema;
const SALT_WORK_FACTOR = 10;
import { ResourceModel, UserGroupModel } from '../index';

const UserSchema = new Schema({
    userName: String,
    name: String,
    pass: String,
    userGroup: { type: Schema.Types.ObjectId, ref: 'UserGroup' },
    phone: String,
    email: String,
    remarks: String,
    meta: {
        createAt: {
            type: Date,
            default: Date.now()
        },
        updateAt: {
            type: Date,
            default: Date.now()
        },
        creater: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        updater: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    }
});

UserSchema.pre('save', function(next) {
    if (this.isNew) {
        this.meta.updateAt = this.meta.createAt = Date.now();
    }
    else {
        this.meta.updateAt = Date.now();
    }
    let salt = bcrypt.genSaltSync(SALT_WORK_FACTOR);
    let hash = bcrypt.hashSync(this.pass, salt);
    this.pass = hash;
    next();
});


UserSchema.statics = {
    
    findById: async function(id) {
        return await this.findOne({_id: id});
    },

    findByName: async function(name, id) {
        if (id) {
            return await this.findOne({name: name, _id: {$ne: id}});
        }
        return await this.findOne({name: name});
    },

    listByPage: async function(page) {
        let filters = page.filters;
        let searches = page.searches;
        for (let k in searches) {
            let keyword = searches[k];
            let reg = new RegExp(keyword, 'i');
            filters[k] = {$regex : reg};
        }
        let sortBy = page.sortBy || 'meta.createAt_desc';

        let sortKey = sortBy.substring(0, sortBy.indexOf('_'));
        let sortText = sortBy.substring(sortBy.indexOf('_')+1, sortBy.length);
        let sortStr = '';
        switch (sortKey) {
            case 'updateAt': sortStr = 'meta.updateAt'; break;
            case 'createAt': sortStr = 'meta.createAt'; break;
            default: sortStr = sortKey;
        }
        if ('desc' == sortText) {
            sortStr = '-' + sortStr;
        }
        let result = await this.find(filters)
                           .populate({ path: 'userGroup', select: 'name' })
                           .sort(sortStr)
                           .skip(page.skip)
                           .limit(page.limit);
        let count = await this.find(filters).count();

        return page.pageQuery(result, count);
    },

    //根据人员权限，动态返回前端左侧菜单树.规定：菜单树 层数 最大为2
    fetchMenusTree: async function(id) {
        const user = await this.findById(id);
        const userGroup = await UserGroupModel.fetchForResources(user.userGroup);
        const tree = [];
        const addAncestors = async (item, menus) => {
            if (item.type == 1) menus[item._id] = {value: item.url, label: item.name, parent: item.parent, icon: item.icon};
            if (item.parent) {
                const parent = await ResourceModel.findById(item.parent);
                if (parent) return await addAncestors(parent, menus);
            }
        }
        if (userGroup) {
            const menus = [];
            for (let i in userGroup.resources) {
                const resource = userGroup.resources[i];
                await addAncestors(resource, menus);
            }

            for (let id in menus) {
                const item = menus[id];
                if (!item.parent) 
                    delete item.parent && tree.push(item);
                else 
                    if (menus[item.parent] && !menus[item.parent].parent)
                        menus[item.parent].children ? menus[item.parent].children.push(item) && delete item.parent
                        : (menus[item.parent].children = [item]) && delete item.parent;
            }
        }
        return tree;
    },

}

UserSchema.methods.comparePassword = function(pass) {
    return bcrypt.compareSync(pass, this.pass);
}

export default mongoose.model('User', UserSchema);
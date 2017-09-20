'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;
import { UserModel } from '../index';

const UserGroupSchema = new Schema({
    name: String,                    //栏目名
    resources: [{ type: Schema.Types.ObjectId, ref: 'Resource' }],
    description: String,
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

UserGroupSchema.pre('save', function(next) {
    if (this.isNew) {
        this.meta.updateAt = this.meta.createAt = Date.now();
    }
    else {
        this.meta.updateAt = Date.now();
    }
    next();
});


UserGroupSchema.statics = {
    
    findById: async function(id) {
        return await this.findOne({_id: id});
    },

    fetchForResources: async function(id) {
        return await this.findOne({_id: id}).populate({path: 'resources'});
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
        let sortBy = page.sortBy || 'meta.createAt_asc';

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
                           // .populate({ path: 'column', select: 'name' })
                           .sort(sortStr)
                           .skip(page.skip)
                           .limit(page.limit);
        let count = await this.find(filters).count();

        return page.pageQuery(result, count);
    },

    hasUser: async function(gid) {
        return (await UserModel.findOne({userGroup: gid})) ? true : false;
    },

}
export default mongoose.model('UserGroup', UserGroupSchema);
'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ResourceSchema = new Schema({
    name: String,                    //栏目名
    parent: {                        //上级栏目
        type: Schema.Types.ObjectId,
        ref: 'Resource'
    },
    sort: Number,                    //排序
    type: String,
    url: String,
    icon: String,
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

ResourceSchema.pre('save', function(next) {
    if (this.isNew) {
        this.meta.updateAt = this.meta.createAt = Date.now();
    }
    else {
        this.meta.updateAt = Date.now();
    }
    next();
});


ResourceSchema.statics = {
    //根据id获取该栏目所有的子孙节点的id的集合,包括自己
    fetchOffspringIds: async function(id) {
        let self = this;
        const ids = [id];
        async function initOffspring(id, ids) {
            let columns = await self.fetchChildren(id);
            for (let i=0; i < columns.length; i++) {
                ids.push(columns[i]._id);
                await initOffspring(columns[i]._id, ids);
            }
            return ids;
        }
        return await initOffspring(id, ids);
    },
    //返回前端显示树需要的数据格式
    fetchForTree: async function() {//- 返回的数据格式为 [{第一棵树：_id,name,children:[...]},{第二棵树：_id,name,children:[...]}],经典递归，子节点无限延伸
        let self = this;
        async function initResource(parent, result) {
            let column = await self.fetchChildren(parent._id);
            if (!column || column.length === 0) {
                delete parent.children;
            }
            for (let i=0; i < column.length; i++) {
                let child = {
                    _id: column[i]._id,
                    label: column[i].name,
                    children: []
                }
                parent.children[i] = child;
                if (!parent._id) {
                    result.push(child);
                }
                await initResource(child);
            }
        }
        let parent = {
            _id: null,
            children: []
        }
        let result = [];
        await initResource(parent, result);
        return result;
    },
    findById: async function(id) {
        return await this.findOne({_id: id});
    },
    findByName: async function(name, id) {
        if (id) {
            return await this.findOne({name: name, _id: {$ne: id}});
        }
        return await this.findOne({name: name});
    },
    //获取父节点
    findParent: async function(id) {
        let column = await this.findOne({_id: id});
        return await this.findOne({_id: column.parent});
    },
    //抓取子节点
    fetchChildren: async function(parent) {
        return await this.find({parent: parent}).sort('sort');
    },
    //判断是否有子节点
    hasChildren: async function(parent) {
        if (await this.findOne({parent: parent})) {
            return true;
        }
        return false;
    },

}
export default mongoose.model('Resource', ResourceSchema);
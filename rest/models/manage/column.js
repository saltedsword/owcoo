'use strict';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;
import mModels from '../modules';

const ColumnSchema = new Schema({
    name: String,                    //栏目名
    parent: {                        //上级栏目
        type: Schema.Types.ObjectId,
        ref: 'Column'
    },
    sort: Number,                    //排序
    display: String,                 //显示
    module: String,                  //所属模块
    status:Number,               //状态：比如 作废
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

ColumnSchema.pre('save', function(next) {
    if (this.isNew) {
        this.meta.updateAt = this.meta.createAt = Date.now();
    }
    else {
        this.meta.updateAt = Date.now();
    }
    next();
});

ColumnSchema.statics = {
    fetch: async function() {
        return await this.find({}).populate({path:'parent', select: 'name'}).sort('sort');
    },
    //根据id获取该栏目所有的子孙节点
    fetchOffspring: async function(id) {
        let self = this
        async function initOffspring(id, result) {
            let columns = await self.fetchChildren(id);
            for (let i=0; i < columns.length; i++) {
                result.push(columns[i]);
                await initOffspring(columns[i]._id, result);
            }
        }
        await initOffspring(id, result);
        return result;
    },
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
    //根据id获取该栏目所有的祖先节点
    fetchAncestors: async function(id) {
        let self = this;
        async function initAncestors(id, result) {
            let column = await self.findParent(id);
            if (column) {
                result.push(column);
                await initAncestors(column._id, result);
            }
        }
        let result = [];
        await initAncestors(id, result);
        return result;
    },
    //判断pid是否是cid的祖先节点
    isAncestors: async function(pid, cid) {
        let self = this;
        async function initAncestors(cid) {
            if (!cid) {
                return false;
            }
            if (pid.toString() == cid.toString()) {
                return true;
            }
            let column = await self.findParent(cid);
            if (column) {
                if (column._id.toString() == pid.toString()) {
                    return true;
                }
                return await initAncestors(column._id);
            }
            return false;
        }
        return await initAncestors(cid);
    },
    //返回前端显示树需要的数据格式
    fetchForTree: async function() {//- 返回的数据格式为 [{第一棵树：_id,name,children:[...]},{第二棵树：_id,name,children:[...]}],经典递归，子节点无限延伸
        let self = this;
        async function initColumn(parent, result) {
            let column = await self.fetchChildren(parent._id);
            if (!column || column.length === 0) {
                delete parent.children;
            }
            for (let i=0; i < column.length; i++) {
                let child = {
                    _id: column[i]._id,
                    name: column[i].name,
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
    //父目录下的子目录所在层级，pid不指定则默认为顶级栏目
    getLevel: async function(id, pid, lev) {
        if (id == null) {
            return 0;
        }
        let level = lev || 1;
        if (id == pid) {
            return 1;
        }
        let parent = await this.findParent(id);

        if (parent) {
            level += 1;
            if (pid && parent._id.toString() == pid) {

                return level;
            }
            return await this.getLevel(parent._id, pid, level);
        } else {
            return level;
        }
    },
    //当前栏目下共有几级栏目（含自己）
    //算法思想：在子节点中只取有孙节点的点，但是当所有子节点都没有孙节点时，随意取一个放入到结果数组，如此迭代
    //最后的结果数组里面放的都是 筛选后的叶子节点，遍历这些叶子节点，取出level值最大的节点
    hasLevel: async function(id) {
        let self = this;
        async function initOffspring(id, result) {
            let columns = await self.fetchChildren(id);
            if (!columns || columns.length == 0) {
                result.push(id);
                return;
            }
            //是否所有子节点都没有子节点
            let allNoChildren = true;
            for (let i=0; i < columns.length; i++) {
                if (!await self.hasChildren(columns[i]._id)) {
                    continue;
                }
                allNoChildren = false;
                await initOffspring(columns[i]._id, result);
            }
            if (allNoChildren) {
                await initOffspring(columns[0]._id, result);
            }
        }

        let result = [];
        await initOffspring(id, result);
        let maxLevel = 0;

        for (let i=0; i<result.length; i++) {
            let curLevel = await self.getLevel(result[i], id);
            if (maxLevel < curLevel) {
                maxLevel = curLevel;
            }
        }
        return maxLevel;
    },
    fetchForDepth: async function() {//- 返回的数据格式为 [{_id,name,depth:1},{_id,name,depth:2}...,{_id,name,depth:1}...],按照深度和sort排序（参照左右值）
        let self = this;
        async function initColumn(parent, depth, result) {
            let columns = await self.fetchChildren(parent);
            for (let i=0; i < columns.length; i++) {
                let column = columns[i];
                column.depth = depth;
                result.push(column);
                if (await self.hasChildren(column._id)) {
                    await initColumn(column._id, depth+1, result);
                }
            }
        }
        let parent = null;
        let depth = 1;
        let result = [];
        await initColumn(parent, depth, result);
        return result;
    },
    //用于级联标签的显示：根据模块名，获取所有对应的栏目，之后再将它们组装成树,同时返回selected选中的栏目的路径
    fetchByModule: async function(module, selected) {
        let columns = module ? await this.find({module: module}).sort('sort') : await this.find({}).sort('sort');

        let idColumns = [], willDelete = [], result = {};

        columns.forEach(item => idColumns[item._id] = { value: item._id, label: item.name, parent: item.parent });

        while (idColumns[selected]) {
            result.selectedOptions ? result.selectedOptions.unshift(selected) : result.selectedOptions = [selected];
            selected = idColumns[selected].parent;
        }

        columns.forEach(item => {
            const p = idColumns[item.parent], c = idColumns[item._id];
            
            if(p) {
                p.children ? p.children.push(c) : p.children = [c];
                willDelete.push(item._id);
            }            
                
        });

        willDelete.forEach(key => delete idColumns[key]);
        
        result.options = Object.keys(idColumns).map(key => { delete idColumns[key].parent; return idColumns[key]});
        result.selectedOptions = result.selectedOptions || [''];
        return result;
    },
    //判断栏目下是否有数据记录
    hasRecords: async function(id) {
        const {module} = await this.findById(id);
        return module !== 'summary' && (await mModels[module].findOne({column: id}));
    },
    //根据模块类型，获取所有的叶子栏目
    fetchLeafByModule: async function(module) {
        const columns = await this.find({module: module}).sort('sort');
        const result = [];
        for (let i in columns) {
            if (!await this.hasChildren(columns[i]._id)) result.push(columns[i]);
        }
        return result;
    },

    // 前台接口
    // 用于级联标签的显示：和上面不同，只要最后一级模块是目标模块就可以
    fetchByModule2: async function(module, selected) {
        let columns = await this.find({module: module}, {name: 1, parent: 1}).sort('sort');
        let modelColumns = {};
        let selectedOptions = [''];

        for (let i = 0; i < columns.length; i++) {
            const c = columns[i]._doc;
            if (await this.hasChildren(c._id)) continue;
            modelColumns[c._id] = c;
            if (selected && selected == c._id.toString()) selectedOptions = [c._id];
            if (c.parent) {
                const p = (await this.findOne({_id: c.parent}, {name: 1, parent: 1}))._doc;
                p.children = [];
                modelColumns[p._id] = p;
                if (selected && selected == c._id.toString()) selectedOptions = [p._id, c._id];
                if (p.parent) {
                    const gf = (await this.findOne({_id: p.parent}, {name: 1, parent: 1}))._doc;
                    gf.children = [];
                    modelColumns[gf._id] = gf;
                    if (selected && selected == c._id.toString()) selectedOptions = [gf._id, p._id, c._id];
                }
            }
        }
        const options = [];
        Object.keys(modelColumns).forEach((k, i) => {
            const c = modelColumns[k];
            if (!c.parent) return options.push(c);
            modelColumns[c.parent].children.push(c);
        });

        return { options, selectedOptions };
    },
    // 前台header导航树
    fetchFrontHeaderTree: async function() {
        let self = this;
        async function initColumn(parent, result) {
            let column = await self.fetchChildren(parent._id);
            for (let i=0; i < column.length; i++) {
                let child = {
                    _id: column[i]._id,
                    name: column[i].name,
                    children: [],
                    display: column[i].display,
                    link: column[i].module === 'summary' ? `/showSummary/${column[i]._id}` : `/${column[i].module}List?column=${column[i]._id}`
                }
                parent.children[i] = child;
                if (child.display === '2' || child.display === '4') {
                    result.push(child);
                }
                await initColumn(child, result);
            }
            return result;
        }
        let parent = {
            _id: null,
            children: []
        }
        let result = [];
        return await initColumn(parent, result);
    },
    // 前台footer导航树
    fetchFrontFooterTree: async function() {
        let self = this;
        async function initColumn(parent, result) {
            let column = await self.fetchChildren(parent._id);
            for (let i=0; i < column.length; i++) {
                let child = {
                    _id: column[i]._id,
                    name: column[i].name,
                    children: [],
                    display: column[i].display,
                    link: column[i].module === 'summary' ? `/showSummary/${column[i]._id}` : `/${column[i].module}List?column=${column[i]._id}`
                }
                parent.children[i] = child;
                if (child.display === '3' || child.display === '4') {
                    result.push(child);
                }
                await initColumn(child, result);
            }
            return result;
        }
        let parent = {
            _id: null,
            children: []
        }
        let result = [];
        return await initColumn(parent, result);
    },

    // 前台content导航 type:为column 或者 article、picture ... 
    fetchFrontContentTree: async function(type, id) {
        const result = {
            paths: [],
            columns: []
        }
        if (!id) return result;

        let cid;
        if (type === 'column') {
            cid = id;
        } else {
            const Model = mModels[type];
            if (!Model) return result;
            const obj = await Model.findOne({_id: id});
            if (!obj) return result;
            cid = obj.column;
        }

        const getLink = column => column.module === 'summary' ? `/showSummary/${column._id}` : `/${column.module}List?column=${column._id}`; 
        const c = await this.findById(cid);
        result.paths.unshift({name: c.name, link: getLink(c)});

        let r = c;
        if (c.parent) {
            const p = await this.findById(c.parent);
            result.paths.unshift({name: p.name, link: getLink(p)});
            if (p.parent) {
                r = await this.findById(p.parent);
                result.paths.unshift({name: r.name, link: getLink(r)});
            } else {
                r = p;
            }
        }

        const fetchOffspring = async (cl, result) => {
            let columns = await this.fetchChildren(cl._id);
            for (let i=0; i < columns.length; i++) {
                const node = columns[i];
                node.level = (cl.level || 1) + 1;
                result.columns.push({name: node.name, level: node.level, link: getLink(node), cur: cid == node._id.toString()});
                await fetchOffspring(node, result);
            }
        }
        await fetchOffspring(r, result);
        result.columnTitle = r.name;
        return result;
    },

}
export default mongoose.model('Column', ColumnSchema);
// 参考：http://www.ruanyifeng.com/blog/2018/07/indexeddb.html
// option = {
//   dbName: '', // 数据库名
//   version: 1, // 数据库版本号
//   primaryKey: 'id' // 需要保存的数据字段
//   keyNames: [{ // 需要保存的数据字段
//     key: '', // 字段名
//     unique: // 当前这条数据是否能重复 (最常用) 默认false
//   }] 
// };
export class IndexedDB {
    constructor({
        dbName,
        version,
        primaryKey,
        keyNames
    }) {
        this.dbName = dbName
        this.version = version
        this.primaryKey = primaryKey
        this.keyNames = keyNames
        this.db = null
    }
    get indexedDB() {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
    }
    async init() {
        if (!this.indexedDB) {
            throw new Error(`浏览器不支持indexedDB`);
        }
        const dbOpenReq = window.indexedDB.open(this.dbName, this.version);
        return new Promise((resolve, reject) => {
            let this_ = this
            dbOpenReq.onsuccess = function (event) {
                console.log(`数据库已开启`);
                this_.db = dbOpenReq.result
                resolve()
            }
            dbOpenReq.onerror = function (event) {
                console.log(`数据库开启失败`);
                reject(new Error(event.target.result))
            }
            dbOpenReq.onupgradeneeded = function (event) {
                this_.db = event.target.result
                this_.db.onerror = function (event) {
                    console.log(`数据库开启失败`);
                    reject(new Error(event.target.result))
                }
                if (!this_.db.objectStoreNames.contains(this_.dbName)) {
                    const objectStore = this_.db.createObjectStore(this_.dbName, {
                        keyPath: this_.primaryKey,
                        autoIncrement: true // 自增
                    });
                    keyNames.forEach(({
                        key,
                        unique
                    }) => objectStore.createIndex(key, key, unique))
                }
                resolve()
            }
        })
    }
    async start(done) {
        await init()
        done && done()
    }
    create(params) {
        let transaction = db.transaction([this.dbName], 'readwrite');
        let objectStore = transaction.objectStore(this.dbName);
        let this_ = this
        return new Promise((resolve, reject) => {
            if (Array.isArray(params)) {
                params.forEach((param) => {
                    objectStore.add(param).onsuccess = function (event) {
                        console.log('数据写入成功');
                    };
                    transaction.onerror = function (event) {
                        console.log('数据库中已有该数据');
                        reject(new Error('数据库中已有该数据'))
                    }
                })
            } else {
                objectStore.add(params).onsuccess = function (event) {
                    console.log('数据写入成功');
                    resolve(event.target.result)
                };
                transaction.onerror = function (event) {
                    console.log('数据库中已有该数据');
                    reject(new Error('数据库中已有该数据'))
                }
            }
        })

    }
    update(params) {
        let transaction = db.transaction([this.dbName], 'readwrite');
        let objectStore = transaction.objectStore(this.dbName);
        let this_ = this
        return new Promise((resolve, reject) => {
            objectStore.put(params).onsuccess = function (event) {
                console.log('数据更新成功');
                resolve(event.target.result)
            };
            transaction.onerror = function (event) {
                console.log('数据更新失败');
                reject(new Error('数据更新失败'))
            }
        })
    }
    deleteByKey(key) {
        let transaction = db.transaction([this.dbName], 'readwrite');
        let objectStore = transaction.objectStore(this.dbName);
        let this_ = this
        return new Promise((resolve, reject) => {
            objectStore.delete(key).onsuccess = function (event) {
                console.log('数据删除成功');
                resolve(event.target.result)
            };
            transaction.onerror = function (event) {
                console.log('数据删除失败');
                reject(new Error('数据删除失败'))
            }
        })
    }
    findByKey(keyValue, indexCursor) {
        let transaction = db.transaction([this.dbName], 'readwrite');
        let objectStore = transaction.objectStore(this.dbName);
        let this_ = this
        let data = []
        return new Promise((resolve, reject) => {
            objectStore.index(indexCursor).openCursor(IDBKeyRange.only(keyValue)).onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    console.log(cursor.value);
                    data.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(data)
                }
            };
            transaction.onerror = function (event) {
                console.log('数据查询失败');
                reject(new Error('数据查询失败'))
            }
        })
    }
    removeDB(dbName) {
        window.indexedDB.deleteDatabase(dbName);
        console.log(`${dbName}数据库已删除`);
    }
    closeDB() {
        this.db.close()
        console.log('数据库已关闭');
    }
}
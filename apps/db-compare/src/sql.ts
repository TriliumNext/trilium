"use strict";

import type { Database } from "sqlite";

async function getSingleResult(db: Database, query: string, params: any[] = []) {
    return await wrap(db, async db => db.get(query, ...params));
}

async function getSingleResultOrNull(db: Database, query: string, params: any[] = []) {
    const all = await wrap(db, async db => db.all(query, ...params));

    return all.length > 0 ? all[0] : null;
}

async function getSingleValue(db: Database, query: string, params: any[] = []) {
    const row = await getSingleResultOrNull(db, query, params);

    if (!row) {
        return null;
    }

    return row[Object.keys(row)[0]];
}

async function getResults(db: Database, query: string, params: any[] = []) {
    return await wrap(db, async db => db.all(query, ...params));
}

async function getIndexed(db: Database, column: string, query: string, params: any[] = []) {
    const results = await getResults(db, query, params);

    const map: Record<string, any> = {};

    for (const row of results) {
        map[row[column]] = row;
    }

    return map;
}

async function getMap(db: Database, query: string, params: any[] = []) {
    const map: Record<string, any> = {};
    const results = await getResults(db, query, params);

    for (const row of results) {
        const keys = Object.keys(row);

        map[row[keys[0]]] = row[keys[1]];
    }

    return map;
}

async function getFlattenedResults<T>(db: Database, key: string, query: string, params: any[] = []) {
    const list: T[] = [];
    const result = await getResults(db, query, params);

    for (const row of result) {
        list.push(row[key]);
    }

    return list;
}

async function execute(db: Database, query: string, params: any[] = []) {
    return await wrap(db, async db => db.run(query, ...params));
}

async function wrap<T>(db: Database, func: (db: Database) => Promise<T>) {
    const thisError = new Error();

    try {
        return await func(db);
    } catch (e: any) {
        console.error("Error executing query. Inner exception: " + e.stack + thisError.stack);

        throw thisError;
    }
}

export default {
    getSingleValue,
    getSingleResult,
    getSingleResultOrNull,
    getResults,
    getIndexed,
    getMap,
    getFlattenedResults,
    execute
};

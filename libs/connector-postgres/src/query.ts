import {FieldDef} from "pg";
import {DatabaseQueryResults, DatabaseQueryResultsColumn, DatabaseUrlParsed, JsValue} from "@azimutt/database-types";
import {connect} from "./connect";

export function execQuery(application: string, url: DatabaseUrlParsed, query: string, parameters: any[]): Promise<DatabaseQueryResults> {
    return connect(application, url, client => {
        return client.query({text: query, values: parameters, rowMode: 'array'}).then(r => {
            return buildResults(query, r.fields, r.rows)
        })
    })
}

function buildResults(query: string, fields: FieldDef[], rows: JsValue[][]): DatabaseQueryResults {
    const columns = buildColumns(fields)
    return {
        query,
        columns,
        rows: rows.map(row => columns.reduce((acc, col, i) => ({...acc, [col.name]: row[i]}), {}))
    }
}

function buildColumns(fields: FieldDef[]): DatabaseQueryResultsColumn[] {
    const keys: { [key: string]: true } = {}
    return fields.map(f => {
        const name = uniqueName(f.name, keys)
        keys[name] = true
        return {name}
    })
}

function uniqueName(name: string, currentNames: { [key: string]: true }, cpt: number = 1): string {
    const newName = cpt === 1 ? name : `${name}_${cpt}`
    if (currentNames[newName]) {
        return uniqueName(name, currentNames, cpt + 1)
    } else {
        return newName
    }
}

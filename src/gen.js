// lmao this file is absolutely cursed, imo. just run it with `node src/gen.js` and copy the output class to index.ts
// last api update: https://github.com/the-blue-alliance/the-blue-alliance/blob/d0c8e4fddd19175422630c865cd6baec93a6f8ff/src/backend/web/static/swagger/api_v3.json
// raw file: https://github.com/the-blue-alliance/the-blue-alliance/blob/main/src/backend/web/static/swagger/api_v3.json

// run this on https://www.thebluealliance.com/apidocs/v3
function run() {
    console.log(
        '{"": "' +
            Array.from(new Set(Array.from(document.querySelectorAll("[data-path]")).map((e) => e.textContent))).join(
                '",\n"": "'
            ) +
            '"}'
    );
}
import fs from "fs";
import paths from "./api.json" with { type: "json" };

function genTypescript(name, type, path, desc) {
    if (!(name.length > 0 && type.length > 0 && path.length > 0)) {
        console.error("invalid data", { name, type, path, desc });
        return "";
    }
    const args = Array.from(path.matchAll(/{([^}]+)}/g));
    const func = `${desc ? `/** ${desc} */` : ""}${name}(${args
        .map((e) => e[1] + ": string")
        .concat("abort?: AbortController")
        .join(
            ", "
        )}): APIResponse<${type}> {\n    return _fetch(BASE_URL + ${args.length > 0 ? `\`${path.replaceAll("{", "${")}\`` : `"${path}"`}, this.API_KEY, abort);\n}`;
    return func;
}

const typescriptMethods = Object.entries(paths).map(([funcName, funcData]) => {
    return genTypescript(funcName, funcData.type, funcData.path, funcData.description);
});

const typescriptClass = `/** BEGIN PLACEHOLDER DATA */
import * as types from "./types";
function _fetch(args: any, ...other: any[]) {
    return args;
}
const BASE_URL = "";
type APIResponse<T> = T;
/** END PLACEHOLDER DATA */


class TBAAPI extends EventTarget {
    API_KEY: string;
    status: types.API_Status | null = null;
    constructor(apiKey: string) {
        super();
        this.API_KEY = apiKey;
        Promise.all([this.getStatus(), this.getSearchIndex()]).then(([status, searchIndex]) => {
            if (status) {
                this.status = status;
                this.dispatchEvent(new Event("load"));
            } else {
                console.error("api not accessible");
                this.dispatchEvent(new Event("loaderror"));
            }
        });
    }
    on(event: string, callback: () => void) {
        this.addEventListener(event, callback);
    }
    ${typescriptMethods.join("\n").trim()}
}`;

fs.writeFileSync("out.ts", typescriptClass);

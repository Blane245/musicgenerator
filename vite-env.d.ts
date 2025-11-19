interface ImportMetaEnv {
    readonly VERSION:string;
    readonly AUTHOR:{name: string, url: string};
    readonly REPOSITORY:{type: string, url: string};
    readonly HOMEPAGE:string;
    readonly BUILD_DATE:string;
    readonly FSPORT:string;
    readonly DBPORT:string;
    readonly PORT:string;
    readonly SEQUENCEEDITORURL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module "*.svg" {
    const content: string;
    export default content;
}
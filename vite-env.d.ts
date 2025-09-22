interface ImportMetaEnv {
    readonly VERSION:string;
    readonly AUTHOR:{name: string, url: string};
    readonly REPOSITORY:{type: string, url: string};
    readonly HOMEPAGE:string;
    readonly BUILD_DATE:string;
    readonly SERVERPORT:string;
    readonly PORT:string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module "*.svg" {
    const content: string;
    export default content;
}
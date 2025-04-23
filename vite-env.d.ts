interface ImportMetaEnv {
    readonly VERSION:string;
    readonly AUTHOR:{name: string, url: string};
    readonly REPOSITORY:{type: string, url: string};
    readonly BUILD_DATE:string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
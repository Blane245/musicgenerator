interface ImportMetaEnv {
    readonly PACKAGE_VERSION:string;
    readonly AUTHOR:{name: string, url: string};
    readonly REPOSITORY:{type: string, url: string};
    readonly VITE_BUILD_DATE:string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
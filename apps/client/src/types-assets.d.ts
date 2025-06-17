declare module "*.png" {
    var path: string;
    export default path;
}

declare module "*?url" {
    var path: string;
    export default path;
}

declare module "*?raw" {
    var content: string;
    export default content;
}

declare module "boxicons/css/boxicons.min.css" { }

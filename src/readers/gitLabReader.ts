/// <reference path="../models/File.ts" />
/// <reference path="../helpers/fetchHelper.ts" />
/// <reference path="../parsers/IParser.ts" />
namespace Readers
{
    import BaseParser = Parsers.BaseParser;
    import GitLabFolder = Models.GitLabFolder;
    import GitLabFile = Models.GitLabFile;

    export class GitLabReader implements IReader
    {
        foldersToSearch : GitLabFolder[] = Array<GitLabFolder>();
        filesToProcess : GitLabFolder[] = Array<GitLabFolder>();

        url : string;

        async do(url : string, project : string, branch : string) : Promise<void>
        {
            await this.getAllFiles((await this.getAllFolders(url, project, branch)));
        }

        //http://code.evolio.cz/api/v4/projects/evolio%2Fefilters/repository/tree?path=EFilters.ViewModels/ViewModel
        //http://https://gitlab.com/api/v4/projects/spix%2Fsteelboo.com/repository/tree?path=
        //url: code.evolio.cz
        //project: evolio%2Fefilters
        async getAllFolders(url : string, project : string, branch : string) : Promise<GitLabFolder[]>
        {
            this.url = 'https://' + url + '/api/v4/projects/' + project + '/repository/';

            let rootFile = new Models.GitLabFolder();
            rootFile.path = "";

            this.foldersToSearch.push(rootFile);

            /*
            while(this.foldersToSearch.length != 0)
            {
                await this.searchFolders(this.url + 'tree', this.foldersToSearch.pop());
            }
            */

            let promises : Promise<void>[] = [];
            do {
               let promise = this.searchFolders(this.url + 'tree', this.foldersToSearch.pop());
               promises.push(promise);
               if (this.foldersToSearch.length === 0){
                   await Promise.all(promises);
                   promises = [];
                   if (this.foldersToSearch.length === 0){
                       break;
                   }
               }
            } while (true);
            return this.filesToProcess;
        }

        getFullName(cl: { contextParent: any; name: string; }) {
            if (cl.contextParent === undefined) {
                return cl.name;
            }else{
                return this.getFullName(cl.contextParent) + "." + cl.name;
            }
            
        }

        getURL(cl: { fileName: string; }, url: string, project: string, branch: string) {
            return url + "/" + project.replace("%2F", "/") + "/blob/" + branch + "/" + cl.fileName;
        }

        blackListedFolders = ["vendor", "assets"];

        sortItem(item : GitLabFolder){
            if(item.type == "blob"){
                this.filesToProcess.push(item);
            }
            else if(item.type == "tree"){
                for (const folder of this.blackListedFolders) {
                    if(item.path.endsWith(folder)){
                        return;
                    }
                }
                this.foldersToSearch.push(item);
            }
        }

        async searchFolders(url: string, folder : GitLabFolder){
            let more = true;
            let page = 1;
            while(more){
                let treeUrl = url + '?path=' + folder.path + "&per_page=100&page=" + page;
                page++;
                let request = new Request(treeUrl);
                let folders = await Helpers.http<Models.GitLabFolder[]>(request);
                more = folders.parsedBody.length == 100;
                for (let folder of folders.parsedBody) {
                    this.sortItem(folder);
                }
            }
        }

        async getAllFiles(filesToProcess : GitLabFolder[]) : Promise<void>
        {
            //console.log(filesToProcess);
            let promises : Promise<void>[] = [];
            for (let file of filesToProcess)
            {
                promises.push(this.processFile(this.url + 'blobs', file));
            }
            await Promise.all(promises);
        }

        blackListedExtensions = [".conf", ".env", ".htaccess", ".txt", ".neon", ".lock", ".json", ",.md", ".yml", "Dockerfile", ".latte", ".ico", ".gitattributes", ".gitignore", ".config", ".docx", ".ttf", ".licx", ".xaml", ".sln", ".csproj", ".zip"];

        async processFile(url: string, file: GitLabFolder){
            for (const extension of this.blackListedExtensions) {
                if(file.path.endsWith(extension)){
                    return;
                }
            }
            let treeUrl = url  + '/' + file.id;
            let request = new Request(treeUrl);
            //console.log(file);
            //let response = await fetch(request,{mode:"cors" ,credentials: "include",  headers: {Accept: 'application/json', 'Content-Type': 'application/json'}})
            let gitLabFile = (await Helpers.http<GitLabFile>(request)).parsedBody;
            //let text = this.b64DecodeUnicode(gitLabFile.content);
            gitLabFile.content = this.b64DecodeUnicode(gitLabFile.content);
            window.postMessage({ type: "FROM_PAGE", data: {id: "parseFile", filename: file.path, file: file, folder: gitLabFile, url: treeUrl}},"*");
            /*let parser = BaseParser.GetParser(file.path.split(".").pop());
            if (parser != null)
            {
                await parser.getClasses(file.path, text)
            }*/
        }

        ///from----https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
        b64DecodeUnicode(str: string) {
            return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            }).join(''))
        }
        //getAllFiles("code.evolio.cz","evolio%2Fefilters");
    }
}
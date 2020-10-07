/// <reference path="../models/File.ts" />
/// <reference path="../helpers/fechHelper.ts" />
/// <reference path="../parsers/IParser.ts" />
namespace Readers
{
    class GitLabReader implements IReader
    {
        foldersToSearch = Array<Models.GitLabFolder>();
        filesToProcess = Array<Models.GitLabFolder>();
        
        //http://code.evolio.cz/api/v4/projects/evolio%2Fefilters/repository/tree?path=EFilters.ViewModels/ViewModel
        //url: code.evolio.cz
        //project: evolio%2Fefilters
        async getAllFiles(url : string, project : string, branch : string)
        {
            let treeUrl = 'https://' + url + '/api/v4/projects/' + project + '/repository/';
            
            //let key = url + "/" + project + "/" + branch;
            let request = new Request(treeUrl + 'tree?per_page=100');
            //let response = await fetch(request,{mode:"cors" ,credentials: "include",  headers: {Accept: 'application/json', 'Content-Type': 'application/json',}})
            //let json = await response.json();
            
            let folders = await Helpers.http<Models.GitLabFolder[]>(request);

            window.postMessage({ type: "FROM_PAGE", data: {id: "classParsingStarted", notificationId: url, message: "Parsing started"}},"");

            for (let folder of folders.parsedBody) {
                this.sortItem(folder);
            }

            /*for (const element in json) 
            {
                if (Object.prototype.hasOwnProperty.call(json, element)) 
                {
                    this.sortItem(json[element]);
                }
            } */

            
            while(this.foldersToSearch.length != 0)
            {
                await this.searchFolders(treeUrl + 'tree', this.foldersToSearch.pop());
            }
            return this.filesToProcess;

            /*
            for (const id in this.filesToProcess) 
            {
                let p = Math.trunc( (id / this.filesToProcess.length) * 100 );
                //console.log(p);
                //console.log(classes.length);
                if (p % 10 === 0) {
                window.postMessage({ type: "FROM_PAGE", data: {id: "classParsingUpdate", notificationId: url, progress:p, message: "Found " + classes.length + " classes!"}},"");
                }
                await this.processFile(treeUrl + 'blobs', this.filesToProcess[id]);
            }   
            //console.log(classes);
            //console.log(contexts);
            
            const formatedClasses = [];
            for (const cl of classes) {
                formatedClasses.push({name: cl.name, fullName: this.getFullName(cl), url: this.getURL(cl, url, project, branch), line: cl.line });
            }
            //console.log(formatedClasses);
            //chrome.runtime.sendMessage("phicehfclmfgkellhdcegnkibnnjaifl", {id: "saveClasses", key: url + "/" + project + "/" + branch, classes: JSON.stringify(formatedClasses)});
            window.postMessage({ type: "FROM_PAGE", data: {id: "saveClasses", key: key, classes: JSON.stringify(formatedClasses)} },"*");
            window.postMessage({ type: "FROM_PAGE", data: {id: "classParsingStoped", notificationId: url}},"*");
            window.postMessage({ type: "FROM_PAGE", data: {id: "classParsingDone", notificationId: url+"_D"}},"*");
            */
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

        sortItem(item : Models.GitLabFolder){
            if(item.type == "blob"){
                this.filesToProcess.push(item);
            }
            else if(item.type == "tree"){
                this.foldersToSearch.push(item);
            }
        }

        async searchFolders(url: string, folder: { path: string; }){
            var more = true;
            var page = 1;
            while(more){
                let treeUrl = url + '?path=' + folder.path + "&per_page=100&page=" + page;
                page++;
                let request = new Request(treeUrl);
                let response = await fetch(request,{mode:"cors" ,credentials: "include",  headers: {Accept: 'application/json', 'Content-Type': 'application/json'}})
                let json = await response.json();
                more = json.length == 100;
                for (var element of json) {
                    this.sortItem(element);
                }
            }
        }

        blackListedExtensions = [".ico", ".gitattributes", ".gitignore", ".config", ".docx", ".ttf", ".licx", ".xaml", ".sln", ".csproj", ".zip"];

        async processFile(url: string, file: { path: string; id: string; }){
            for (const extension of this.blackListedExtensions) {
                if(file.path.endsWith(extension)){
                    return;
                }
            }
            let treeUrl = url + '/' + file.id;
            let request = new Request(treeUrl);
            //console.log(file);
            let response = await fetch(request,{mode:"cors" ,credentials: "include",  headers: {Accept: 'application/json', 'Content-Type': 'application/json'}})
            let json = await response.json();
            let text = this.b64DecodeUnicode(json.content);
            if(file.path.endsWith(".cs"))
            {
                await Parsers.CsParser.getClasses(file.path, text)
            }
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
/// <reference path="../models/File.ts" />
namespace Readers
{
    export interface IReader
    {
        getAllFiles(filesToProcess : Models.GitLabFolder[]) : Promise<void>;
        getAllFolders(url : string, project : string, branch : string) : Promise<Models.GitLabFolder[]>;

    }
} 

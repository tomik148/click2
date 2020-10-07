/// <reference path="../models/File.ts" />
namespace Readers
{
    export interface IReader
    {
        getAllFiles(url : string, project : string, branch : string) : Promise<Models.GitLabFolder[]>;
        
    }
} 

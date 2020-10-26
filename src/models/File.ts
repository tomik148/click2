namespace Models
{
    export class GitLabFolder {
        id: string;
        name: string;
        type: string;
        path: string;
        mode: string;
    }

    export class GitLabFile {
        size: number;
        encoding: string;
        content: string;
        sha: string;
    }
}
namespace Models
{
    class Class
    {
        constructor(name: string, fullName: string, url: URL, line: number) {
            this.name = name;
            this.fullName = fullName;
            this.url = url;
            this.line = line;
        }

        name: string; 
        fullName: string;
        url: URL; 
        line: number;
    }
}
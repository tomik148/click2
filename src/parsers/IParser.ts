namespace Parsers
{
    export enum ContextTypes
    {
        "NameSpace"=1, "Class"=2, "Method"=3, "Property"=4, "Field"=5, "Enum"=6, "Interface"=7
    }

    interface IParser
    {
        getClasses(fileName, fileText) : Promise<void>;
    }

    export abstract class BaseParser implements IParser
    {
        abstract getClasses(fileName, fileText): Promise<void>;


        static GetParser(fileExtention : string) : IParser | null
        {
            switch (fileExtention)
            {
                case "cs":
                    return new CsParser();
                case "php":
                    return new PhpParser();
                default :
                  return null;
            }
        }
    }
}

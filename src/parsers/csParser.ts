namespace Parsers
{
    enum ContextTypes
    {
        "NameSpace"=1, "Class"=2, "Method"=3, "Property"=4, "Field"=5, "Enum"=6, "Interface"=7
    }

    export class CsParser //implements IParser
    {
        
        static classes = [];
        static contexts = [];

        //const contextTypes = Object.freeze({"NameSpace":1, "Class":2, "Method":3, "Property":4, "Field":5, "Enum":6, "Interface":7})


        static async getClasses(fileName, fileText) 
        {
            if(fileName.endsWith(".cs"))
            {
                let formatedfileText = this.removeStrings(fileText); 
                formatedfileText = this.removeComents(formatedfileText);
                formatedfileText = this.removeUsings(formatedfileText);

                //const regex = /class (\w+)/g;

                var rootContexts = await this.getContexts(formatedfileText, undefined);
                for (const index in rootContexts) {
                    rootContexts[index].fileName = fileName;
                    this.processContext(rootContexts[index]);
                }

                if (rootContexts.length > 1) {
                var a = 5;
                }
            }
            
        }

        static async processContext(context) 
        {
            let add = true;
            if (context.type === ContextTypes.NameSpace) {
                for (const cont of this.contexts) {
                    if (cont.identifier === context.identifier) {
                        add = false;
                    }
                }
                if (add) {
                    this.contexts.push(context);
                }
            }

            if (context.type === ContextTypes.Class || context.type === ContextTypes.NameSpace) 
            {
                if (context.type === ContextTypes.Class) {
                    this.classes.push(context);
                }
                let Contexts = await this.getContexts(context.body, context);
                //contexts.concat(Contexts);
                for (const index in Contexts) {
                    Contexts[index].fileName = context.fileName;
                    this.processContext(Contexts[index]);
                }
            }
        }

        static async getContexts(text, contextParent) 
        {
            var last = 0;
            var identifier = "";
            var identifierLine = 0;

            var start = 0;
            var depth = 0;

            var line = 0;
            var Contexts = [];

            for (let index = 0; index < text.length; index++) 
            {
                if(text[index] === '\n')
                {
                    line++;
                }
                if(text[index] === '{')
                {
                    depth++;
                    if(start === 0)
                    {
                        start = index + 1;
                        identifier = text.substring(last, index-1).trim();
                        identifierLine = line-1;//:(
                    }
                }
                if(text[index] === '}')
                {
                    depth--;
                    if(depth === 0)
                    {
                        let parent;

                        if (contextParent !== undefined && this.contexts.filter(c => c.identifier === contextParent.identifier).length > 0) {
                            parent = this.contexts.filter(c => c.identifier === contextParent.identifier)[0];
                        }
                        else{
                            parent = contextParent;
                        }
                        if (!(identifier.trim().startsWith("=") || identifier.trim() === "")) {
                            let context = {identifier: identifier.trim(), line: identifierLine, body: text.substring(start, index-1), contextParent: parent, childeren: [], type:null, name:null};
                            context.type = await this.getContextType(context);
                            context.name = await this.getName(context);
                            if (parent !== undefined) {
                                parent.childeren.push(context);
                                context.line += parent.line;
                            }
                            Contexts.push(context);
                        }   
                        start = 0;
                        last = index + 1;
                    }
                }
                if(text[index] === ';')
                {
                    if(depth === 0)
                    {
                        let parent;

                        if (contextParent !== undefined && this.contexts.filter(c => c.identifier === contextParent.identifier).length > 0) {
                            parent = this.contexts.filter(c => c.identifier === contextParent.identifier)[0];
                        }
                        else{
                            parent = contextParent;
                        }
                        identifier = text.substring(last, index).trim();
                        if (!(identifier.startsWith("=") || identifier === "")) {
                            let field = {identifier: identifier, line: line, contextParent: parent, type: ContextTypes.Field, body:null, name:null};
                            if (identifier.includes("=>")) {
                                field.body = identifier.split("=>")[1].trim();
                                field.identifier = identifier.split("=>")[0].trim();

                                field.type = ContextTypes.Property;
                                if (field.identifier.includes("(")) {
                                    field.type = ContextTypes.Method;
                                }

                            }
                            if (identifier.includes("abstract")) {
                                if (identifier.includes("(")) {
                                    field.type = ContextTypes.Method;
                                }

                            }
                            field.name = await this.getName(field);
                            if (parent !== undefined) {
                                if (parent.childeren === undefined){
                                    parent.childeren = [];
                                }
                                field.line += parent.line;
                                parent.childeren.push(field);
                            }
                        }
                        last = index + 1;
                    }
                }
            }
            return Contexts;
        }

        static removeComents(fileText)
        {
            const regex = /\/\*.*?\*\/|\/\/.*?$/gsm;
            return fileText.replace(regex, "");
        }

        static removeStrings(fileText)
        {
            const regex = /".*?"/gs;
            return fileText.replace(regex, "\"\"");
        }

        static removeUsings(fileText)
        {
            const regex = /using .*?;/g;
            return fileText.replace(regex, "");
        }

        static async getContextType(context) 
        {
            if (context.contextParent === undefined) 
            {
                if (context.identifier.toLowerCase().includes("namespace ")) 
                {
                    return ContextTypes.NameSpace;
                }
            }

            if (context.contextParent === undefined || context.contextParent.type === ContextTypes.NameSpace) 
            {
                if (context.identifier.toLowerCase().includes("class ")) 
                {
                    return ContextTypes.Class;
                }

                if (context.identifier.toLowerCase().includes("interface ")) 
                {
                    return ContextTypes.Interface;
                }

                if (context.identifier.toLowerCase().includes("enum ")) 
                {
                    return ContextTypes.Enum;
                }
            }

            if (context.contextParent.type === ContextTypes.Class) 
            {
                if (context.identifier.toLowerCase().includes("class ")) 
                {
                    return ContextTypes.Class;
                }

                if (context.identifier.toLowerCase().includes("interface ")) 
                {
                    return ContextTypes.Interface;
                }

                if (context.identifier.toLowerCase().includes("enum ")) 
                {
                    return ContextTypes.Enum;
                }
                //if (/(?<=(?:(?:protected)|(?:public)|(?:private)) *(?:\w+ )* *)\w+(?= *[(])/g.test(context.identifier.toLowerCase()))
                //if (/(?<!new) \w+(?=(?:(<[^>]+?>))? *[(])/g.test(context.identifier.toLowerCase()))
                if (/\w+(?=(?:<[^>]+?>)?[(])/g.test(context.identifier.toLowerCase()))
                
                {
                    return ContextTypes.Method;
                }
                if (context.identifier.toLowerCase().includes("=")) 
                {
                    return ContextTypes.Field;
                }
                return ContextTypes.Property;
            }
            return undefined;
        }

        static async getName(context) 
        {
            if (context.type === ContextTypes.Class) 
            {
                const regex = /(?<=class )\w*/;
                return context.identifier.match(regex)[0];
            }
            if (context.type === ContextTypes.NameSpace) 
            {
                const regex = /(?<=namespace )[\w.]*/;
                return context.identifier.match(regex)[0];
            }
            if (context.type === ContextTypes.Method) 
            {
                const regex = /\w+(?=(?:<[^>]+?>)?[(])/;
                return context.identifier.match(regex)[0];
            }
            if (context.type === ContextTypes.Property) 
            {
                const regex = /\w+(?:\[.*?\])?$/sm;
                return context.identifier.match(regex)[0];
            }
            if (context.type === ContextTypes.Field) 
            {
                const regex = /\w+(?= ?=)|(?<=delegate.* )\w+(?=\(.*?\))|\w+$/m;
                return context.identifier.match(regex)[0];
            }
            if (context.type === ContextTypes.Enum) 
            {
                const regex = /(?<=enum )\w*/;
                return context.identifier.match(regex)[0];
            }
            if (context.type === ContextTypes.Interface) 
            {
                const regex = /(?<=interface )\w*/;
                return context.identifier.match(regex)[0];
            }
            return context.identifier;
        }

    }   
}
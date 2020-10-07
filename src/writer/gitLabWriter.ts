namespace Writers
{
    export class GitLabWriter
    {
        getAllLineSpans() {
            return document.querySelectorAll("pre.code code span.line");
        }
        
        processLine(lineSpan){
            for (let i = 0; i < lineSpan.childElementCount; i++) {
                //console.log(lineSpan.children[i].textContent);
               /*const found = formatedClasses.find((c)=>c.name == lineSpan.children[i].textContent);
                if (found !== undefined) {
                    //console.log(found);
                    lineSpan.children[i].classList.add("custom-class");
                    lineSpan.children[i].setAttribute("data-href", found.url + "#L" + found.line)
                }*/
            }
            return true;
            //console.log("Done!");
        }
        
        runNew() {
            console.log("runing");
            document.onkeydown = function keydown(evt) {
                if (evt.key == "Alt") {
                    let links = document.querySelectorAll(".custom-class");
                    links.forEach((link,key,p)=>{
                        link.classList.remove("custom-link");
                        link.removeEventListener("click",linkClick);
                    },this);
                }
            }
        
            document.onkeyup = function keydown(evt) {
                if (evt.key == "Alt") {
                    let links = document.querySelectorAll(".custom-class");
                    links.forEach((link,key,p)=>{
                        link.classList.remove("custom-link");
                        link.removeEventListener("click",linkClick);
                    },this);
                    evt.preventDefault();
                }
                
            }
        
            function linkClick(evt){
                //console.log(evt.currentTarget.getAttribute("data-href"));
                window.location.href = window.location.protocol + "//" + evt.currentTarget.getAttribute("data-href");
            }
        
            const callback = function(mutationsList, observer) {
                // Use traditional 'for loops' for IE 11
                for(let mutation of mutationsList) {
                    console.log(mutation);
                }
                observer.disconnect();
                for (const lineSpan of this.getAllLineSpans()) { this.processLine(lineSpan); }  
            };
            const targetNode = document.querySelector(".blob-viewer");
            const config = { attributes: true, childList: true, subtree: true };
            const observer = new MutationObserver(callback);
        
            if (this.getAllLineSpans().length == 0) {
                observer.observe(targetNode, config);
            }
            else {
                this.getAllLineSpans().forEach((lineSpan,key,parent) => {this.processLine(lineSpan);},this) ; 
            }
            // Start observing the target node for configured mutations
        
            
            //for (const lineSpan of getAllLineSpans()) { processLine(lineSpan); }
        
        }
    }
}



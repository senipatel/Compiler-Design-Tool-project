// Navbar Tab Switching
document.querySelectorAll('.nav-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

// Left Factoring and Recursion Logic
function processGrammar() {
    const grammar = document.getElementById('grammar').value.trim();
    const outputDiv = document.getElementById('output');
    const explainButton = document.getElementById('explainButton');
    const explanationDiv = document.getElementById('explanation');
    outputDiv.innerHTML = '';
    explanationDiv.style.display = 'none';
    explainButton.style.display = 'none';

    if (!grammar) {
        outputDiv.innerHTML = "<p class='error'>Please enter a valid grammar.</p>";
        return;
    }

    try {
        const productions = grammar.split('\n').map(line => line.trim()).filter(line => line !== '');
        const grammarMap = new Map();

        productions.forEach(prod => {
            const parts = prod.split('->');
            if (parts.length !== 2) throw new Error(`Invalid production format: ${prod}`);
            const left = parts[0].trim();
            const rights = parts[1].split('|').map(s => s.trim());
            if (!grammarMap.has(left)) grammarMap.set(left, []);
            grammarMap.get(left).push(...rights);
        });

        let isLeftRecursive = hasLeftRecursion(grammarMap);
        let isLeftFactoring = hasLeftFactoring(grammarMap);

        if (!isLeftRecursive && !isLeftFactoring) {
            outputDiv.innerHTML = "<p class='error'>Grammar is not left recursive or left factored.</p>";
            return;
        }

        let leftRecursionRemoved = isLeftRecursive ? removeLeftRecursion(grammarMap) : grammarMap;
        let leftFactoringRemoved = isLeftFactoring ? removeLeftFactoring(leftRecursionRemoved) : leftRecursionRemoved;

        let resultHTML = `<h3>Original Grammar:</h3><pre>${grammar}</pre>`;
        if (isLeftRecursive) resultHTML += `<h3>Left Recursion Removed:</h3><pre>${formatGrammar(leftRecursionRemoved)}</pre>`;
        if (isLeftFactoring) resultHTML += `<h3>Left Factoring Removed:</h3><pre>${formatGrammar(leftFactoringRemoved)}</pre>`;
        outputDiv.innerHTML = resultHTML;
        explainButton.style.display = 'block';
        explanationDiv.innerHTML = generateExplanation(isLeftRecursive, isLeftFactoring);
    } catch (error) {
        outputDiv.innerHTML = `<p class='error'>Error: ${error.message}</p>`;
    }
}

function hasLeftRecursion(grammarMap) {
    for (const [nonTerminal, productions] of grammarMap.entries()) {
        if (productions.some(prod => prod.startsWith(nonTerminal))) return true;
    }
    return false;
}

function removeLeftRecursion(grammarMap) {
    let newGrammar = new Map();
    for (const [nonTerminal, productions] of grammarMap.entries()) {
        let recursiveProds = [];
        let nonRecursiveProds = [];
        productions.forEach(prod => {
            if (prod.startsWith(nonTerminal)) recursiveProds.push(prod.slice(nonTerminal.length).trim());
            else nonRecursiveProds.push(prod);
        });
        if (recursiveProds.length > 0) {
            let newNonTerminal = nonTerminal + "'";
            let newRulesForNT = nonRecursiveProds.map(prod => prod + " " + newNonTerminal);
            newGrammar.set(nonTerminal, newRulesForNT);
            let newRulesForNewNT = recursiveProds.map(prod => prod + " " + newNonTerminal);
            newRulesForNewNT.push("ε");
            newGrammar.set(newNonTerminal, newRulesForNewNT);
        } else {
            newGrammar.set(nonTerminal, productions);
        }
    }
    return newGrammar;
}

function hasLeftFactoring(grammarMap) {
    for (const [nonTerminal, productions] of grammarMap.entries()) {
        let groups = {};
        productions.forEach(prod => {
            if (prod.length > 0) {
                let firstChar = prod[0];
                if (!groups[firstChar]) groups[firstChar] = [];
                groups[firstChar].push(prod);
            }
        });
        for (let key in groups) {
            if (groups[key].length > 1) return true;
        }
    }
    return false;
}

function removeLeftFactoring(grammarMap) {
    let newGrammar = new Map();
    for (const [nonTerminal, productions] of grammarMap.entries()) {
        let factoredProductions = [];
        let additionalRules = new Map();

        let groups = {};
        productions.forEach(prod => {
            if (prod.length > 0) {
                let firstChar = prod[0];
                if (!groups[firstChar]) groups[firstChar] = [];
                groups[firstChar].push(prod);
            }
        });

        for (let key in groups) {
            let group = groups[key];
            if (group.length > 1) {
                let commonPrefix = findCommonPrefix(group);
                let newNonTerminal = nonTerminal + "'";
                let newRules = group.map(prod => {
                    let remaining = prod.slice(commonPrefix.length).trim();
                    return remaining === "" ? "ε" : remaining;
                });
                factoredProductions.push(`${commonPrefix}${newNonTerminal}`);
                if (additionalRules.has(newNonTerminal)) {
                    additionalRules.set(newNonTerminal, additionalRules.get(newNonTerminal).concat(newRules));
                } else {
                    additionalRules.set(newNonTerminal, newRules);
                }
            } else {
                factoredProductions.push(group[0]);
            }
        }
        newGrammar.set(nonTerminal, factoredProductions);
        for (const [nt, rules] of additionalRules.entries()) {
            newGrammar.set(nt, rules);
        }
    }
    return newGrammar;
}

function findCommonPrefix(strings) {
    if (strings.length === 0) return "";
    let prefix = strings[0];
    for (let i = 1; i < strings.length; i++) {
        while (!strings[i].startsWith(prefix)) {
            prefix = prefix.slice(0, -1);
            if (prefix === "") break;
        }
    }
    return prefix;
}

function formatGrammar(grammarMap) {
    let result = "";
    for (const [nonTerminal, productions] of grammarMap.entries()) {
        result += `${nonTerminal} -> ${productions.join(" | ")}\n`;
    }
    return result.trim();
}

function showExplanation() {
    document.getElementById('explanation').style.display = 'block';
}

function generateExplanation(isLeftRecursive, isLeftFactoring) {
    let explanation = "<h3>Explanation of Grammar Processing</h3>";
    if (isLeftRecursive) {
        explanation += `
            <h4>Left Recursion Removal:</h4>
            <p>Left recursion occurs when a non-terminal refers to itself as the first symbol, causing infinite recursion.</p>
            <p>For A → Aα | β:</p>
            <p>A → βA'<br>A' → αA' | ε</p>
        `;
    }
    if (isLeftFactoring) {
        explanation += `
            <h4>Left Factoring Removal:</h4>
            <p>Left factoring removes common prefixes from productions.</p>
            <p>For A → αβ | αγ:</p>
            <p>A → αA'<br>A' → β | γ</p>
        `;
    }
    return explanation;
}

// Tree Generation Logic
function parseGrammar(grammar) {
    const rules = {};
    if (!grammar || typeof grammar !== 'string') {
        console.error("Grammar input is empty or invalid:", grammar);
        return rules; // Return empty object if grammar is invalid
    }

    grammar.split('\n').forEach(line => {
        const [left, right] = line.split('->').map(s => s.trim());
        if (left && right) {
            rules[left] = right.split('|').map(s => s.trim());
        }
    });

    console.log("Parsed rules:", rules); // Debug output
    return rules;
}

function generateTree(type, context) {
    const grammarInput = context === 'math' ? 'mathGrammarInput' : 'englishGrammarInput';
    const stringInput = context === 'math' ? 'mathStringInput' : 'englishStringInput';
    const treeOutput = context === 'math' ? 'mathTreeOutput' : 'englishTreeOutput';
    const errorDiv = context === 'math' ? 'mathError' : 'englishError';

    const grammar = document.getElementById(grammarInput).value.trim();
    const input = document.getElementById(stringInput).value.trim();
    const svg = d3.select(`#${treeOutput} svg`);

    svg.selectAll("*").remove();
    document.getElementById(errorDiv).style.display = 'none';

    if (!grammar || !input) {
        document.getElementById(errorDiv).textContent = 'Please enter both grammar and input string';
        document.getElementById(errorDiv).style.display = 'block';
        return;
    }

    try {
        const rules = parseGrammar(grammar);
        if (Object.keys(rules).length === 0) {
            throw new Error('No valid grammar rules found');
        }
        if (!rules['S'] && context === 'english') {
            throw new Error('Grammar must define a start symbol "S" for English trees');
        }

        let treeData;
        if (context === 'math') {
            const tokens = tokenizeMath(input);
            treeData = type === 'syntax' ? buildMathSyntaxTree(tokens) : buildMathParseTree(tokens);
        } else {
            const tokens = tokenizeEnglish(input);
            console.log("Tokens:", tokens); // Debug tokens
            treeData = type === 'syntax' ? buildEnglishSyntaxTree(tokens, rules) : buildEnglishParseTree(tokens, rules);
        }

        if (!treeData) throw new Error('Invalid input or grammar');

        const width = 800;
        const height = 400;
        svg.attr("viewBox", [0, 0, width, height]);
        const root = d3.hierarchy(treeData);
        const treeLayout = d3.tree().size([width - 100, height - 100]);
        treeLayout(root);

        const g = svg.append("g").attr("transform", "translate(50, 50)");
        g.selectAll(".link")
            .data(root.links())
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("d", d3.linkVertical().x(d => d.x).y(d => d.y));

        const node = g.selectAll(".node")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x},${d.y})`);

        node.append("circle").attr("r", 5);
        node.append("text")
            .attr("dy", ".35em")
            .attr("x", d => d.children ? -10 : 10)
            .attr("text-anchor", d => d.children ? "end" : "start")
            .text(d => d.data.name);
    } catch (error) {
        document.getElementById(errorDiv).textContent = error.message || 'Error: Invalid grammar or input';
        document.getElementById(errorDiv).style.display = 'block';
        console.error("Error in tree generation:", error);
    }
}

function tokenizeMath(input) {
    return input.match(/\(|\)|\{|\}|\[|\]|[a-zA-Z]+|[0-9]+|[\+\-\*\/]/g);
}

function tokenizeEnglish(input) {
    return input.split(" ");
}

function buildMathSyntaxTree(tokens) {
    if (tokens.length === 1) return { name: tokens[0] };
    let operatorIndex = findOperatorIndex(tokens);
    if (operatorIndex === -1) return null;
    return {
        name: tokens[operatorIndex],
        children: [
            buildMathSyntaxTree(tokens.slice(0, operatorIndex)),
            buildMathSyntaxTree(tokens.slice(operatorIndex + 1))
        ]
    };
}

function buildMathParseTree(tokens) {
    if (tokens.length === 1) return { name: tokens[0] };
    let operatorIndex = findOperatorIndex(tokens);
    if (operatorIndex === -1) return null;
    return {
        name: "E",
        children: [
            { name: "E", children: [buildMathParseTree(tokens.slice(0, operatorIndex))] },
            { name: tokens[operatorIndex] },
            { name: "T", children: [buildMathParseTree(tokens.slice(operatorIndex + 1))] }
        ]
    };
}

function buildEnglishSyntaxTree(tokens, rules) {
    if (!rules || !rules['S'] || tokens.length < 1) {
        console.error("Invalid rules or no 'S' rule:", rules);
        return null;
    }

    const result = parseSyntaxNonTerminal('S', tokens, rules, 0);
    if (!result || result.nextIndex !== tokens.length) {
        console.log("Syntax tree parsing failed:", result);
        return null;
    }
    return result.tree;
}

// Helper function for syntax tree parsing (simplified)
function parseSyntaxNonTerminal(nonTerminal, tokens, rules, startIndex) {
    if (startIndex >= tokens.length) return null;

    const productions = rules[nonTerminal];
    if (!productions) return null;

    for (const production of productions) {
        const symbols = production.split(' ').filter(s => s);
        let currentIndex = startIndex;
        const children = [];

        let valid = true;
        for (const symbol of symbols) {
            if (rules[symbol]) { // Non-terminal
                const subResult = parseSyntaxNonTerminal(symbol, tokens, rules, currentIndex);
                if (!subResult) {
                    valid = false;
                    break;
                }
                // For syntax tree, only include major constituents (e.g., NP, VP)
                // If the non-terminal is a phrase (like NP, VP), keep it; otherwise, flatten its children
                if (['NP', 'VP', 'S'].includes(symbol)) {
                    children.push(subResult.tree);
                } else {
                    // Flatten the children (e.g., Det, Adj, N become direct children of NP)
                    children.push(...subResult.tree.children);
                }
                currentIndex = subResult.nextIndex;
            } else { // Terminal
                if (currentIndex >= tokens.length || tokens[currentIndex] !== symbol) {
                    valid = false;
                    break;
                }
                children.push({ name: tokens[currentIndex] });
                currentIndex++;
            }
        }

        if (valid) {
            return {
                tree: { name: nonTerminal, children },
                nextIndex: currentIndex
            };
        }
    }

    return null;
}

function buildEnglishParseTree(tokens, rules) {
    if (!rules['S'] || tokens.length < 1) return null;

    // Parse starting from the root 'S'
    const result = parseParseNonTerminal('S', tokens, rules, 0);
    if (!result || result.nextIndex !== tokens.length) return null; // Ensure all tokens are consumed
    return result.tree;
}

// Helper function for parse tree parsing
function parseParseNonTerminal(nonTerminal, tokens, rules, startIndex) {
    if (startIndex >= tokens.length) return null;

    const productions = rules[nonTerminal];
    if (!productions) return null;

    for (const production of productions) {
        const symbols = production.split(' ').filter(s => s);
        let currentIndex = startIndex;
        const children = [];

        let valid = true;
        for (const symbol of symbols) {
            if (rules[symbol]) { // Non-terminal
                const subResult = parseParseNonTerminal(symbol, tokens, rules, currentIndex);
                if (!subResult) {
                    valid = false;
                    break;
                }
                children.push(subResult.tree);
                currentIndex = subResult.nextIndex;
            } else { // Terminal
                if (currentIndex >= tokens.length || tokens[currentIndex] !== symbol) {
                    valid = false;
                    break;
                }
                children.push({ name: symbol });
                currentIndex++;
            }
        }

        if (valid) {
            return {
                tree: { name: nonTerminal, children },
                nextIndex: currentIndex
            };
        }
    }

    return null;
}

function findOperatorIndex(tokens) {
    const precedence = { "+": 1, "-": 1, "*": 2, "/": 2 };
    let minPrecedence = Infinity;
    let operatorIndex = -1;

    for (let i = 0; i < tokens.length; i++) {
        if (precedence[tokens[i]] && precedence[tokens[i]] <= minPrecedence) {
            minPrecedence = precedence[tokens[i]];
            operatorIndex = i;
        }
    }
    return operatorIndex;
}
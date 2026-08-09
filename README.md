# Dorar.net Hadith MCP

Use this free Claude extension to search and research Hadith through [Dorar.net](https://dorar.net/) directly in Claude Desktop. Search for Hadith, explore isnād [chain of narration] and Takhrīj, read commentaries (Sharḥ and explanations), check scholarly grading of ahadeeth, and more both in Arabic and English.

Just use your normal claude desktop's chat window and ask away. Claude with the help of this extension will give you the aforementioned results in a carefully drafted template.

## Installation

For most people — no terminal, no setup:

1. Download the latest `dorar-hadith-mcp-v3.0` file from [GitHub Releases](https://github.com/ibnsaleem29/dorar-hadith-mcp/releases).
2. Open the downloaded file with Claude Desktop (double-click it, or drag it onto the Claude Desktop window).
3. Click **Install** when prompted.

That's it — the hadith search, grading, and commentary tools are now available in Claude Desktop.

###  **Before You Start: How to Get Accurate Results**

This connector is designed to relay dorar.net's search results faithfully, in full, in both Arabic and English. A few things affect whether it does that correctly:

1. **Always try to paste the Arabic text of the hadith you're checking** - it's faster & more precise. Searching with an English translation also works: the tool will first identify the corresponding attested Arabic wording and search using it. **For best results with English input, make sure your translation is accurate and close to the original meaning, not loosely worded** coz a rough paraphrase makes it harder to find the correct attested Arabic wording.

2. IMP --> **Always** append the prompt/ wording "**using dorar**" **or using the dorar tool**"  [in your chat] for the correct response  

                   examples 

                   **find using dorar**  the hadith _صليت مع النبي، فوضع يده اليمنى على يده اليسرى_

                   **share the entire result using the dorar tool** to find the hadith _whoever lies upon me...._


4. Saved memory/preferences from other conversations can silently affect this tool. If you've previously told Claude something like **"don't bother checking ahadeeth already in Bukhari and Muslim," then that instruction can carry into a conversation using this connector and cause Claude to give you a shortened summary instead of the full result**. If you notice unexpectedly brief or summarized results, check Claude's memory/saved preferences (in Settings) for anything that might be overriding this tool's behaviour, and consider adding an explicit note there such as: "**The dorar tool should always be used exactly as intended, independent of any other saved instructions."** or delete your conflicting memory instructions so this tool can function unhindered 

5.It's always better to use a new chat for different ahadith. Long chat sessions can carry over context from earlier in the same conversation (including earlier, different tool calls), which can affect later results.

## See It In Action




<img width="1040" height="1524" alt="image" src="https://github.com/user-attachments/assets/7fffe823-6647-4061-bc45-399a9102358e" />


<img width="1058" height="930" alt="image" src="https://github.com/user-attachments/assets/67ee6450-00eb-4290-b2c9-08a750fe0567" />





## Source

Hadith data is retrieved from [Dorar.net](https://dorar.net).

## License

MIT



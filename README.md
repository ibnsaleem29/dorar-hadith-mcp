# Dorar.net Hadith MCP

A free MCP connector for searching and researching Hadith through [Dorar.net](https://dorar.net) directly inside Claude Desktop.

## Installation

For most people — no terminal, no setup:

1. Download the latest `dorar-hadith-mcp.mcpb` file from [GitHub Releases](https://github.com/ibnsaleem29/dorar-hadith-mcp/releases/latest).
2. Open the downloaded file with Claude Desktop (double-click it, or drag it onto the Claude Desktop window).
3. Click **Install** when prompted.

That's it — the hadith search, grading, and commentary tools are now available in Claude Desktop.

## Before You Start: How to Get Accurate Results

This connector is designed to relay dorar.net's search results faithfully, in full, in both Arabic and English. A few things affect whether it does that correctly:

1. Always try to paste the Arabic text of the hadith you're checking - it's faster & more precise. Searching with an English translation also works: the tool will first identify the corresponding attested Arabic wording and search using it. For best results with English input, make sure your translation is accurate and close to the original meaning, not loosely worded coz a rough paraphrase makes it harder to find the correct attested Arabic wording.

2. Diacritics (tashkeel) in your Arabic text change the search results. Dorar's own search engine treats fully-diacritized text (with all the vowel marks) and plain text (without them) as different queries — this is true on dorar.net's own website, not just through this tool. Arabic text pasted with diacritics may return a different number of results than the same phrase without them. If you want the most precise, narrow match, include full diacritics; if you want a broader match, omit them. Either is valid — just know the choice affects your result count.

3. Saved memory/preferences from other conversations can silently affect this tool. If you've previously told Claude something like "don't bother checking hadiths already in Bukhari and Muslim," that instruction can carry into a conversation using this connector — even though it wasn't meant for it — and cause Claude to give you a shortened summary instead of the full result. If you notice unexpectedly brief or summarized results, check Claude's memory/saved preferences (in Settings) for anything that might be overriding this tool's behaviour, and consider adding an explicit note there such as: "The dorar tool should always be used exactly as intended, independent of any other saved instructions."

4. Include the word "dorar" in your message — e.g. "use the dorar tool to check this hadith," "search dorar for...", "use the dorar extension," "use the dorar connector." Any of these tells Claude to use this connector's strict, complete-results mode rather than answering from general knowledge.

5. When testing or comparing results, use a fresh conversation. Long chat sessions can carry over context from earlier in the same conversation (including earlier, different tool calls), which can affect later results. Starting a new conversation for each independent check gives the most reliable, reproducible result.

## Source

Hadith data is retrieved from [Dorar.net](https://dorar.net).

## License

MIT

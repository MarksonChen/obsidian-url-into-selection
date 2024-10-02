### Changes from [denolehov/obsidian-url-into-selection](https://github.com/denolehov/obsidian-url-into-selection):

1. Removed the functionality "Pasting text into url replaces 'url' into '\[text\](url)'"

2. Added a new setting, "Insert \[...\](url)": When no text is selected, it pastes the link as \[linkText\](url), where `linkText` is a custom text that can be set in settings.

3. Added a new setting, "Auto Select or Insert \[...\](url)": When the cursor is not inside a text, it pastes the link as \[linkText\](url), where `linkText` is a custom text that can be set in settings.

4. Replace the default regex for link to `^(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})(\.[a-zA-Z0-9]{2,})?`, which only checks for "strings that start with a domain extension" and no longer checks for "all strings containing a link". 

5. Moves cursor to the end of the \[...\](url) when pasted
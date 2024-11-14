# Zelda Oracles Sign Text Updater
An app that allows a user with no assembly (coding language) or yaml code knowledge to update the text on any sign in Zelda Oracle Of Ages/Seasons by modifying the 
data/{GAME}/signText.s and text/{GAME}/text.yaml files located withn the oracles-disasm folder.
## How It Works
  When first on localhost, you will be asked to create text for your newly placed sign (if wanted) or you can explore different sections of the page and find a ton of
interesting stuff on there. Enough of that, how this app actually works is that it will take your current sign position, the room the sign is placed at, and custom text of the sign
and place that text inside a file known as text.yaml (Usually located in the text folder along with the game folder in the oracles disasm folder that you give to the app) which
the file is supposed to control text for all signs in the Oracle games. Once your new text is saved to the file, The sign position and room number the sign is placed will be used
to add a line of assembly code to a file known as signText.s (Usually located in the data folder along with the game folder in the oracles disasm folder that you give to the app)
which that file is supposed to control which text goes to which sign (don't worry, the signText.s is documented so that you gain a better understanding of how the file works).
  Once everything is finished, a message will pop up on the right of the screen telling you whatever or not it is safe to test your new sign in the rom hack you are currently
working on. If the operation is successful, you will notice that the game takes a few seconds longer to build than normal due to the builder compiling the new text.
If the operation didn't go as expected, then you won't be able to see your results and an error message will pop up on the right of the screen as a result. 
  If you believe that the issue you are experiencing happens to be a bug with the code, Please report it in the Issues panel on top of this GitHub Repo.
## Setup
In order to use this app, you must do the folllowing things
1. Download The [Node.JS](https://nodejs.org) Installer
2. Start up the installer and follow the prompts as you install Node.JS
3. Once installed, you may use Command Prompt or Ternimal and type in node -v to check to see if the installation suceeded.
   If it did, then you are ready to move on to the next step.
4. Download this project using the Code dropdown at the top right of the screen followed by the Download ZIP Button.
5. Once downloaded, extract the project zip like you normally would with other zip files.
6. go into the project folder and use the Shift + Right click shortcut to open the ternimal or command prompt.
7. Once in, you will use the command npm install to install npm dependencies needed for this project to work properly
8. Once all of the npm dependencies are installed, you will type npm start and a new browser window will open for you along with the app.
I hope that you are able to take good advantage of this app. Thank you for willing to use the Oracles Sign Text Updater!
## Current Project Status
* Ages signs work mostly fine after updating them, adding new text, and deleting the text. Even taking you to the right room in LynnaLab if you want to see where the sign is.
* Seasons signs also work, however, because of the way the signText.s file was constructed in the oracles-disasm repo for seasons, tracking the room in LynnaLab 
during sign edit is currently broken right now and you may need to update the room to the correct location the sign is placed just to update the text on the sign. 
Position is not affected so you should be fine.

Copyright 2024 - Oracles Sign Text Updater

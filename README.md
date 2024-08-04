# [moodychess](https://moodychess.vercel.app/)
A chess web app that focuses on online gameplay and offers all the essential features for comfortable online chess.
- **frontend** (this) written in **Javascript**, **HTML** and **CSS**, deployed using [Vercel](https://vercel.com/)
- for **backend**, look [here](https://github.com/JakubDurkac/chess_project_backend)

## Features

### Chessboard and Menu
- responsive **chessboard** where you can make moves by dragging and dropping pieces with your mouse
- simple **menu** to access all the interactive options at one place

### Online Game Setup
- in **settings**, choose **time**, **increment** and starting **color** or leave the default
- enter your name and press **Play Online** to enter the online matchmaking
- at this point, a game featuring your selected settings is created, you are displayed to others and free to be joined by others
- at the same time, other created games are displayed to you and you may choose to join anybody
- two players are matched when one clicks on **GO** next to the other's name, game starts
- the displayed list of available opponents updates automatically for everyone each time a player joins matchmaking, leaves it or a match between two starts

<img src="/images/screenshots/online_choose_opponent.png">

### During Online Match
- **names** of the players, **current score**, **clocks states** and **material difference** are shown; with the first move, synchronized clocks start ticking
- players make moves, all the standard chess rules are enforced, **only legal moves are allowed**
- before a move is played, app performs a check on its legality, app considers piece move patterns, their color, castling and castling rights,
en passant, checks, pins, etc.
- app **announces** checkmates, stalemates, draws by 50-move rule, threefold repetition, insufficient material; wins and losses on time, all by highlighting the kings squares
- use buttons **Resign Game** and **Disconnect** (results in a loss), or **Offer Draw** to the opponent, who may accept or decline it in the **Game Log**, where it pops up
-  on opponent's disconnect, the player is also disconnected automatically, as there is no reason to stay online, after that, player can search for another online match
- inspect and analyze previous positions at any time by clicking on a particular move in the interactive **moves notation**, or by using arrow keys to move backwards and forwards;
last played move of the displayed position is always highlighted in the notation, as well as on the board 
- control **the piece which a pawn promotes to** when it reaches last rank by selecting the piece in the **promotion choice bar** right below the moves notation
- locally change the perspective of the board at any time by pressing the **Flip Board** button
- **Game Log** provides communication between matched up players, as well as communication between the app and the player, informing about all the important events

<img src="/images/screenshots/online_gameplay.png">

### Offline Singleplayer
- at the very beginning, the board is empty, pressing **Play Offline** at the bottom sets up the pieces on the board and then each **Restart Game** resets the pieces to their initial squares
- anytime a player is offline or yet to be matched with someone, player can freely play for both sides in a singleplayer match, utilizing most of the perks already mentioned in the section about online matches
- if an online match starts, board resets, syncing up with opponent's board

### Credits
- project uses piece images and sound files from [Lichess](https://github.com/lichess-org)
- Lichess provides these resources free to use under the [GNU AFFERO GENERAL PUBLIC LICENSE](https://github.com/lichess-org/lila/blob/master/LICENSE)
- please visit their site for more details and to support their work 

// Import Firebase Database Library
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// Firebase Database Configuration
const firebaseConfig = {
    apiKey: "AIzaSyABEPi1IZBPrwyXX7GpVA5wphEdZ9D2b28",
    authDomain: "jc8055cny2026.firebaseapp.com",
    projectId: "jc8055cny2026",
    storageBucket: "jc8055cny2026.firebasestorage.app",
    messagingSenderId: "431423230439",
    appId: "1:431423230439:web:3519a4aab211aa9b32ed42"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getFirestore(app);

// Elements Initialization
const lblRoomId = document.getElementById("lblRoomId");
const lblCenter = document.getElementById("lblCenter");
const lblAction = document.getElementById("lblAction");
const lblPlayer1Nickname = document.getElementById("lblPlayer1Nickname");
const lblPlayer1Score = document.getElementById("lblPlayer1Score");
const lblPlayer2Nickname = document.getElementById("lblPlayer2Nickname");
const lblPlayer2Score = document.getElementById("lblPlayer2Score");
const imgPlayer1 = document.getElementById("imgPlayer1");
const imgPlayer2 = document.getElementById("imgPlayer2");
const gameboard = document.querySelector(".gameboard");
const cells = document.querySelectorAll(".gameboard > div");

// Variables Initialization
let isPlayer1 = false;
let isPlayer2 = false;
let player1Pop = [null, null];
let player2Pop = [null, null];
let player1Position = [null, null];
let player2Position = [null, null];
let player1CellIndex = null;
let player2CellIndex = null;
let player1PopCellIndex = null;
let player2PopCellIndex = null;
let playerPopIndex = null;
let playerAction = 0;
let player1score = 0;
let player2score = 0;
let win = 0;

// Display Room ID
const roomId = new URLSearchParams(window.location.search).get("roomId");
if (roomId)
    lblRoomId.textContent = roomId;
else
    window.location.href = "landing.html";

// Copy Room ID
document.getElementById("btnCopy").addEventListener("click", (e) => {
    navigator.clipboard.writeText(`${window.location.origin}/CNY2026/landing.html?roomId=${roomId}`);
    e.target.classList.add("clicked");
    setTimeout(() => {e.target.classList.remove("clicked")}, 500);
});

// Room Reference
const roomRef = doc(database, "room", roomId);

// Function Convert Coordinate
function ConvertCoordinate(coordinate, verifyPlayer1) {
    let newCoordinate = coordinate;
    if (verifyPlayer1 && coordinate[0]!=null)
    {
        newCoordinate[0] = 4 - coordinate[0];
        newCoordinate[1] = 4 - coordinate[1];
    }
    return newCoordinate;
}

// Function Convert Index
function ConvertIndex(coordinate) {
    return (5 * coordinate[0] + coordinate[1]);
}

// Function Convert Axis
function ConvertAxis(index) {
    if (isPlayer1)
        index = 24 - index;

    return [Math.floor(index / 5), index % 5];
}

// Listen Account
auth.onAuthStateChanged((user) => {
    // No Account
    if (!user) 
    {
        window.location.href = `landing.html?roomId=${roomId}`;
        return;
    }

    // Get User UID
    const userUID = user.uid;

    // Game Logic
    onSnapshot(roomRef, (snapshot) => {
        // Database Data
        const data = snapshot.data();

        // Game Info
        lblPlayer1Nickname.textContent = data.player_1_nickname;
        lblPlayer1Score.textContent = data.player_1_score;
        lblPlayer2Nickname.textContent = data.player_2_nickname;
        lblPlayer2Score.textContent = data.player_2_score;
        lblCenter.textContent = (data.win==0) ? "vs" : "WIN";

        // Game Win
        win = data.win;

        // Check Players
        isPlayer1 = userUID==data.player_1_uid;
        isPlayer2 = userUID==data.player_2_uid;

        // Players Coordinate 
        player1Pop = ConvertCoordinate(data.player_1_pop, isPlayer1);
        player2Pop = ConvertCoordinate(data.player_2_pop, isPlayer1);
        player1Position = ConvertCoordinate(data.player_1_position, isPlayer1);
        player2Position = ConvertCoordinate(data.player_2_position, isPlayer1);

        // Calculate Player Index
        player1CellIndex = ConvertIndex(player1Position);
        player2CellIndex =  ConvertIndex(player2Position);
        player1PopCellIndex =  ConvertIndex(player1Pop);
        player2PopCellIndex =  ConvertIndex(player2Pop);

        // Player Score
        player1score = data.player_1_score;
        player2score = data.player_2_score;

        // Player 1 Special Gameboard
        if (isPlayer1)
            gameboard.classList.add("player1");

        // Clean Gameboard
        cells.forEach((cell) => {
            cell.innerHTML = "";
            cell.classList.remove("pop");
        });

        // Display Player 1
        cells[player1CellIndex].innerHTML = `<img src="Images/Player1.png">`;

        if (!data.player_2_uid)
        {
            // Player 2 Not Join
            lblAction.textContent = "Wait Player";
            imgPlayer2.style.opacity = "25%";
        }
        else
        {
            // Display Player 2
            cells[player2CellIndex].innerHTML = `<img src="Images/Player2.png">`;
            imgPlayer1.style.opacity = "100%";
            imgPlayer2.style.opacity = "100%";
            lblAction.textContent = "";

            // Display Pop Only Players
            if ( isPlayer1 || isPlayer2)
            {
                playerPopIndex = -1;

                if (isPlayer1 && player1Pop[0]!=null)
                    playerPopIndex = player1PopCellIndex;
                
                if (isPlayer2 && player2Pop[0]!=null)
                    playerPopIndex = player2PopCellIndex;

                if (playerPopIndex != -1)
                {
                    cells[playerPopIndex].innerHTML = "!";
                    cells[playerPopIndex].classList.add("pop");
                }
            }

            if (win==1)
                lblAction.innerHTML = "Player 1";
            else if (win==2)
                lblAction.innerHTML = "Player 2";
            else
            {
                // Display Which Player Move
                imgPlayer1.style.opacity = (data.current_player == 1) ? "100%" : "25%";
                imgPlayer2.style.opacity = (data.current_player == 1) ? "25%" : "100%";
            
                if ((isPlayer2 && (data.current_player == 1)) || (isPlayer1 && (data.current_player == 2)))
                    lblAction.textContent = "Wait";

                if (isPlayer1 && data.current_player == 1)
                {
                    (playerAction==0) ? SelectPopCell() : MovePlayer(1);
                    lblAction.textContent = (playerAction==0) ? "Move Pop" : "Move Player";
                }

                if (isPlayer2 && data.current_player == 2)
                {
                    (playerAction==0) ? SelectPopCell() : MovePlayer(2);
                    lblAction.textContent = (playerAction==0) ? "Move Pop" : "Move Player";
                }
            }
        }
    });
});

function SelectPopCell() {
    cells.forEach((cell) => {
        cell.addEventListener("click", SelectCellAction);
    });
    cells[player1CellIndex].removeEventListener("click", SelectCellAction);
    cells[player2CellIndex].removeEventListener("click", SelectCellAction);
}

function MovePlayer(currentPlayer) {
    let playerPosition = (currentPlayer==1) ? player1Position : player2Position;
    let otherPlayerIndex = (currentPlayer==1) ? player2CellIndex : player1CellIndex;

    let arrowCellsIndex = [];
    let arrowCellsDisplay = [playerPosition[1]!=4, playerPosition[0]!=4, playerPosition[1]!=0, playerPosition[0]!=0];

    arrowCellsIndex.push( 5*playerPosition[0]+(playerPosition[1]+1) );  // Right
    arrowCellsIndex.push( 5*(playerPosition[0]+1)+playerPosition[1] );  // Down
    arrowCellsIndex.push( 5*playerPosition[0]+(playerPosition[1]-1) );  // Left
    arrowCellsIndex.push( 5*(playerPosition[0]-1)+playerPosition[1] );  // Up

    for(let index=0; index<4; index++)
    {
        if (arrowCellsDisplay[index] && arrowCellsIndex[index]!=otherPlayerIndex && arrowCellsIndex[index]!=playerPopIndex)
        {
            let htmlCommand = `<img src="Images/Arrow.png" style="width: 36px;  transform: rotate(${index*90}deg); transform-origin: center;"> `;
            cells[arrowCellsIndex[index]].innerHTML = htmlCommand;
            cells[arrowCellsIndex[index]].addEventListener("click", SelectCellAction);
        }
    }
}

async function SelectCellAction(e) {
    let selectedIndex = Array.from(cells).indexOf(e.currentTarget);

    cells.forEach((cell) => {
        cell.removeEventListener("click", SelectCellAction);
    });

    if(playerAction == 0)
    {
        // Move Pop
        let firebasePopCommand = {};
        const newPop = ConvertAxis(selectedIndex);

        if (isPlayer1)
            firebasePopCommand["player_1_pop"] = [newPop[0], newPop[1]];
        else
            firebasePopCommand["player_2_pop"] = [newPop[0], newPop[1]];
        firebasePopCommand["current_player"] = (isPlayer1) ? 2 : 1;

        await updateDoc(roomRef, firebasePopCommand);
    }
    else
    {
        // Move Player
        GameCheck(selectedIndex);
    }

    playerAction = (playerAction+1 == 3) ? 0 : playerAction + 1;
}

async function GameCheck(selectedPositionIndex) {
    let firebasePositionCommand = {};
    let newPosition = [];
    let otherPlayerPopIndex = (isPlayer1) ?  player2PopCellIndex : player1PopCellIndex;

    if (selectedPositionIndex == otherPlayerPopIndex)
    {
        // Step On Pop
        newPosition[0] = (isPlayer1) ? 0 : 4 ;
        newPosition[1] = 2;

        if (isPlayer1)
        {
            firebasePositionCommand["player_2_pop"] = [null, null];
            firebasePositionCommand["player_2_score"] = player2score + 1;
        }
        else
        {
            firebasePositionCommand["player_1_pop"] = [null, null];
            firebasePositionCommand["player_1_score"] = player1score + 1;
        }
    }
    else
    {
        newPosition = ConvertAxis(selectedPositionIndex);
        
        // Win Condition
        if(isPlayer1&&newPosition[0]==4)
            firebasePositionCommand["win"] = 1;

        if((isPlayer2&&newPosition[0]==0))
            firebasePositionCommand["win"] = 2;
    }

    if (isPlayer1)
        firebasePositionCommand["player_1_position"] = [newPosition[0], newPosition[1]];
    else
        firebasePositionCommand["player_2_position"] = [newPosition[0], newPosition[1]];
    firebasePositionCommand["current_player"] = (isPlayer1) ? 2 : 1;

    await updateDoc(roomRef, firebasePositionCommand);

}
